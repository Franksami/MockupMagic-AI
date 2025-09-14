import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getConvexCircuitBreaker, getWhopCircuitBreaker } from "@/lib/circuit-breaker";

/**
 * Check if error is related to authentication/authorization
 */
function isAuthError(error: unknown): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  const errorString = error.toString?.()?.toLowerCase() || '';

  return (
    message.includes('invalid') ||
    message.includes('unauthorized') ||
    message.includes('token') ||
    message.includes('auth') ||
    errorString.includes('401') ||
    errorString.includes('forbidden')
  );
}

/**
 * Server-side authentication endpoint for Whop users
 */
export async function GET(request: NextRequest) {
  try {
    // Development mode bypass for iframe-less testing
    if (process.env.NODE_ENV === 'development' && !request.headers.get('whop-user-id') && !request.headers.get('x-whop-user-token')) {
      console.log('🛠️ Development mode: Using mock authentication');

      const mockWhopUser = {
        id: 'dev_user_123',
        email: 'dev@mockupmagic.com',
        name: 'Dev User',
        username: 'devuser',
        profilePicture: undefined,
      };

      const mockConvexUser = {
        _id: 'dev_convex_123',
        whopUserId: 'dev_user_123',
        email: 'dev@mockupmagic.com',
        name: 'Dev User',
        subscriptionTier: 'pro',
        creditsRemaining: 1000,
        onboardingCompleted: true,
        limits: {
          maxFileSize: 50, // MB
          maxConcurrentJobs: 10,
          apiRateLimit: 100
        }
      };

      return NextResponse.json({
        whopUser: mockWhopUser,
        convexUser: mockConvexUser,
        isAuthenticated: true,
        source: 'development_mock',
        warning: 'Using development authentication - not for production'
      });
    }

    // 1. Validate required environment variables
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      console.error('Authentication error: NEXT_PUBLIC_CONVEX_URL is not configured');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_WHOP_APP_ID) {
      console.error('Authentication error: NEXT_PUBLIC_WHOP_APP_ID is not configured');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Whop App ID not configured' },
        { status: 500 }
      );
    }

    // 2. Initialize Convex client safely inside handler
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // 3. Validate Whop token using dynamic import for edge compatibility
    let userId: string;
    try {
      const { validateToken } = await import('@whop-apps/sdk');
      const result = await validateToken({ headers: request.headers });
      userId = result.userId;

      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized', details: 'Invalid or missing token' },
          { status: 401 }
        );
      }
    } catch (tokenError) {
      console.error('Token validation error:', tokenError);
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Token validation failed' },
        { status: 401 }
      );
    }

    // 4. Create user object with minimal data from validateToken
    const whopUser = {
      id: userId,
      email: `${userId}@whop.user`, // Placeholder email
      name: "Whop User", // Placeholder name
      username: userId.slice(-8), // Use last 8 chars of userId as username
      profilePicture: undefined,
    };

    // 5. Get subscription data for the user with circuit breaker
    const subscriptionData = await getUserSubscriptionDataWithFallback(userId);

    // 6. Sync user with Convex database using circuit breaker
    const convexResult = await syncUserWithConvex({
      convex,
      whopUser,
      userId,
      subscriptionData,
    });

    if (convexResult.success) {
      return NextResponse.json({
        whopUser,
        convexUser: convexResult.data,
        isAuthenticated: true,
        source: 'convex',
      });
    } else {
      // Fallback: Return basic auth success without Convex data
      console.warn('Convex unavailable, using fallback auth:', convexResult.error);
      return NextResponse.json({
        whopUser,
        convexUser: null,
        isAuthenticated: true,
        source: 'fallback',
        warning: 'Database temporarily unavailable',
      });
    }

  } catch (error) {
    console.error('Unexpected authentication error:', error);

    // Classify error type and return appropriate status
    const isAuth = isAuthError(error);
    const statusCode = isAuth ? 401 : 500;
    const errorMessage = isAuth ? 'Unauthorized' : 'Authentication failed';

    // Even in case of errors, provide fallback response for circuit breaker errors
    if (error.message?.includes('Circuit breaker') && error.message?.includes('OPEN')) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          details: 'Backend services are recovering. Please try again in a moment.',
          retry_after: 30
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      },
      { status: statusCode }
    );
  }
}

/**
 * Get user subscription data from Whop
 */
async function getUserSubscriptionData(userId: string) {
  try {
    // Import WhopAPI dynamically for edge compatibility
    const { WhopAPI } = await import('@whop-apps/sdk');

    // Get user's memberships and subscription data
    const userResponse = await WhopAPI.me({
      headers: { 'x-whop-user-token': userId }
    }).GET("/me", {});

    if (!userResponse.data) {
      throw new Error('Failed to fetch user data from Whop');
    }

    const user = userResponse.data;

    // Define your Whop product ID to tier mapping using environment variables
    const TIER_MAP: Record<string, string> = {
      [process.env.NEXT_PUBLIC_WHOP_STARTER_PRODUCT_ID || 'prod_starter_fallback']: 'starter',
      [process.env.NEXT_PUBLIC_WHOP_GROWTH_PRODUCT_ID || 'prod_growth_fallback']: 'growth',
      [process.env.NEXT_PUBLIC_WHOP_PRO_PRODUCT_ID || 'prod_pro_fallback']: 'pro'
    };

    // Find active membership
    const activeMembership = user.memberships?.find((membership: {
      valid: boolean;
      status: string;
      product_id: string;
      id: string;
      plan_id: string;
      expires_at: number;
    }) =>
      membership.valid && membership.status === 'active'
    );

    if (activeMembership) {
      const tier = TIER_MAP[activeMembership.product_id] || 'starter';

      return {
        tier,
        subscriptionId: activeMembership.id,
        isActive: true,
        whopProductId: activeMembership.product_id,
        planId: activeMembership.plan_id,
        expiresAt: activeMembership.expires_at,
        metadata: {
          whopUsername: user.username,
          whopEmail: user.email,
          accessPasses: user.access_passes || []
        }
      };
    }

    // No active subscription found
    return {
      tier: "starter",
      subscriptionId: null,
      isActive: false,
      whopProductId: null,
      planId: null,
      expiresAt: null,
      metadata: {
        whopUsername: user.username,
        whopEmail: user.email,
        accessPasses: user.access_passes || []
      }
    };

  } catch (error) {
    console.error("Failed to get subscription data:", error);

    // Return fallback data on error
    return {
      tier: "starter",
      subscriptionId: null,
      isActive: false,
      whopProductId: null,
      planId: null,
      expiresAt: null,
      metadata: {}
    };
  }
}

/**
 * Get subscription data with circuit breaker for Whop API
 */
async function getUserSubscriptionDataWithFallback(userId: string) {
  const whopCircuitBreaker = getWhopCircuitBreaker();

  try {
    if (whopCircuitBreaker.isAvailable()) {
      return await whopCircuitBreaker.execute(() => getUserSubscriptionData(userId));
    } else {
      console.warn('Whop circuit breaker is OPEN, using fallback subscription data');
      return getFallbackSubscriptionData();
    }
  } catch (error) {
    console.warn('Whop subscription data failed, using fallback:', error);
    return getFallbackSubscriptionData();
  }
}

/**
 * Sync user with Convex using circuit breaker
 */
async function syncUserWithConvex({
  convex,
  whopUser,
  userId,
  subscriptionData,
}: {
  convex: ConvexHttpClient;
  whopUser: {
    id: string;
    email: string;
    name?: string;
    username?: string;
    profilePicture?: string;
  };
  userId: string;
  subscriptionData: {
    tier: string;
    subscriptionId: string | null;
    isActive: boolean;
    whopProductId: string | null;
    planId: string | null;
    expiresAt: number | null;
    metadata?: Record<string, unknown>;
  };
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const convexCircuitBreaker = getConvexCircuitBreaker();

  try {
    if (!convexCircuitBreaker.isAvailable()) {
      return {
        success: false,
        error: 'Convex circuit breaker is OPEN - service temporarily unavailable'
      };
    }

    const result = await convexCircuitBreaker.execute(async () => {
      // Try to sync user with Convex with enhanced subscription data
      await convex.mutation(api.auth.syncWhopUser, {
        whopUserId: userId,
        email: subscriptionData.metadata?.whopEmail || whopUser.email,
        name: subscriptionData.metadata?.whopUsername || whopUser.name || whopUser.username || "Unknown User",
        avatarUrl: whopUser.profilePicture,
        subscriptionData: {
          tier: subscriptionData.tier,
          subscriptionId: subscriptionData.subscriptionId,
          isActive: subscriptionData.isActive,
          whopProductId: subscriptionData.whopProductId,
          planId: subscriptionData.planId,
          expiresAt: subscriptionData.expiresAt,
        },
      });

      // Get the full user data from Convex
      const convexUser = await convex.query(api.auth.getUserByWhopId, {
        whopUserId: userId,
      });

      if (!convexUser) {
        throw new Error('Failed to create or retrieve user from database');
      }

      return convexUser;
    });

    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || 'Failed to sync with Convex'
    };
  }
}

/**
 * Fallback subscription data when Whop API is unavailable
 */
function getFallbackSubscriptionData() {
  return {
    tier: "starter",
    subscriptionId: null,
    isActive: false,
  };
}
