import { WhopServerSdk } from "@whop/api";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Initialize Whop Server SDK
export const whopSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
  appApiKey: process.env.WHOP_API_KEY!,
});

/**
 * Client-side authentication function that calls the server API
 */
export async function authenticateUser() {
  try {
    const response = await fetch('/api/auth/whop', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return null; // User not authenticated
      }
      throw new Error(`Authentication failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to authenticate user:", error);
    return null;
  }
}

/**
 * Server-side function to get authenticated Whop user from request headers
 * This should only be used in API routes (server-side)
 */
export async function getWhopUser(headersList: Headers) {
  try {
    // Development mode bypass
    if (process.env.NODE_ENV === 'development' && !headersList.get('whop-user-id') && !headersList.get('x-whop-user-token')) {
      return {
        id: 'dev_user_123',
        email: 'dev@mockupmagic.com',
        name: 'Dev User',
        username: 'devuser',
        profilePicture: undefined,
      };
    }

    const { validateToken } = await import("@whop-apps/sdk");
    const { userId } = await validateToken({ headers: headersList });
    
    if (!userId) {
      return null;
    }
    
    return {
      id: userId,
      email: `${userId}@whop.user`,
      name: "Whop User",
      username: userId.slice(-8),
      profilePicture: undefined,
    };
  } catch (error) {
    console.error("Failed to get Whop user:", error);
    return null;
  }
}

/**
 * Server-side authentication function for API routes
 * This handles both development and production authentication
 */
export async function authenticateUserServerSide(headersList: Headers) {
  try {
    const whopUser = await getWhopUser(headersList);
    if (!whopUser) {
      return null;
    }

    // For development mode, return mock user data
    if (process.env.NODE_ENV === 'development' && whopUser.id === 'dev_user_123') {
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

      return {
        whopUser,
        convexUser: mockConvexUser,
        isAuthenticated: true
      };
    }

    // Get user data from Convex
    const userData = await convex.query(api.functions.users.getByWhopId, {
      whopUserId: whopUser.id
    });

    return {
      whopUser,
      convexUser: userData,
      isAuthenticated: true
    };
  } catch (error) {
    console.error("Server-side authentication failed:", error);
    return null;
  }
}

/**
 * Get user subscription data from Whop
 */
export async function getUserSubscriptionData(_userId: string) {
  try {
    // Get user's memberships
    // const memberships = await whopSdk.withUser(userId).users.getCurrentUser();
    
    // Extract subscription information
    const subscriptionData = {
      tier: "starter", // Default tier
      subscriptionId: null,
      isActive: false,
      whopProductId: null,
      expiresAt: null,
      planId: null,
    };
    
    // TODO: Parse actual membership data based on your Whop product structure
    // This is a placeholder - update based on your actual subscription structure
    
    return subscriptionData;
  } catch (error) {
    console.error("Failed to get subscription data:", error);
    return {
      tier: "starter",
      subscriptionId: null,
      isActive: false,
      whopProductId: null,
      expiresAt: null,
      planId: null,
    };
  }
}

/**
 * Check if user has access to a specific feature based on subscription
 */
export async function checkUserAccess(userId: string, feature: string): Promise<boolean> {
  try {
    const subscriptionData = await getUserSubscriptionData(userId);

    // Define feature access based on subscription tiers
    const featureAccess: Record<string, string[]> = {
      starter: ["basic_mockups"],
      growth: ["basic_mockups", "premium_templates", "bulk_generation"],
      pro: ["basic_mockups", "premium_templates", "bulk_generation", "api_access", "custom_templates"],
    };

    const userTier = subscriptionData.tier as keyof typeof featureAccess;
    return featureAccess[userTier]?.includes(feature) || false;
  } catch (error) {
    console.error("Failed to check user access:", error);
    return false;
  }
}

/**
 * Validate user has access to specific Whop product using SDK
 */
export async function validateUserProductAccess(userId: string, productId: string): Promise<boolean> {
  try {
    const { WhopAPI } = await import('@whop-apps/sdk');

    // Use Whop SDK to check access to specific product
    const accessCheck = await WhopAPI.app().GET('/app/memberships', {
      params: {
        query: {
          user_id: userId,
          product_id: productId
        }
      }
    });

    if (accessCheck.data && Array.isArray(accessCheck.data.data) && accessCheck.data.data.length > 0) {
      // Check if any membership is active
      return accessCheck.data.data.some((membership: any) =>
        membership.status === 'active' && membership.valid
      );
    }

    return false;
  } catch (error) {
    console.error('Failed to validate product access:', error);
    return false;
  }
}

/**
 * Get user's active membership for tier-based access control
 */
export async function getUserActiveMembership(userId: string) {
  try {
    const { WhopAPI } = await import('@whop-apps/sdk');

    const membershipResponse = await WhopAPI.app().GET('/app/memberships', {
      params: {
        query: { user_id: userId }
      }
    });

    if (membershipResponse.data && Array.isArray(membershipResponse.data.data) && membershipResponse.data.data.length > 0) {
      // Find the highest tier active membership
      const activeMemberships = membershipResponse.data.data.filter((membership: any) =>
        membership.status === 'active' && membership.valid
      );

      if (activeMemberships.length > 0) {
        // Sort by tier priority (pro > growth > starter)
        const tierPriority = { pro: 3, growth: 2, starter: 1 };

        return activeMemberships.reduce((highest: any, current: any) => {
          const currentTier = getTierFromProductId(current.product_id);
          const highestTier = getTierFromProductId(highest.product_id);

          return (tierPriority[currentTier as keyof typeof tierPriority] || 0) >
                 (tierPriority[highestTier as keyof typeof tierPriority] || 0) ? current : highest;
        });
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get active membership:', error);
    return null;
  }
}

/**
 * Get tier from product ID using environment mapping
 */
function getTierFromProductId(productId: string): string {
  const TIER_MAP: Record<string, string> = {
    [process.env.NEXT_PUBLIC_WHOP_STARTER_PRODUCT_ID || '']: 'starter',
    [process.env.NEXT_PUBLIC_WHOP_GROWTH_PRODUCT_ID || '']: 'growth',
    [process.env.NEXT_PUBLIC_WHOP_PRO_PRODUCT_ID || '']: 'pro'
  };

  return TIER_MAP[productId] || 'starter';
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const user = await convex.query(api.auth.getUserByWhopId, { whopUserId: userId });
    return user?.creditsRemaining || 0;
  } catch (error) {
    console.error("Failed to get user credits:", error);
    return 0;
  }
}

/**
 * Deduct credits from user account
 */
export async function deductUserCredits(userId: string, amount: number): Promise<boolean> {
  try {
    await convex.mutation(api.auth.deductCredits, {
      whopUserId: userId,
      amount,
      reason: "mockup_generation",
    });
    return true;
  } catch (error) {
    console.error("Failed to deduct user credits:", error);
    return false;
  }
}

interface WhopWebhookPayload {
  type: string;
  data: {
    user_id: string;
    id: string;
    status: string;
    product?: {
      tier: string;
    };
  };
}

/**
 * Webhook handler for Whop subscription updates
 */
export async function handleWhopWebhook(payload: WhopWebhookPayload) {
  try {
    const { type, data } = payload;
    
    switch (type) {
      case "membership.created":
      case "membership.updated":
        await syncUserSubscription(data);
        break;
      case "membership.deleted":
        await handleSubscriptionCancellation(data);
        break;
      default:
        console.log("Unhandled webhook type:", type);
    }
  } catch (error) {
    console.error("Failed to handle webhook:", error);
    throw error;
  }
}

/**
 * Sync user subscription data from webhook
 */
async function syncUserSubscription(membershipData: WhopWebhookPayload["data"]) {
  try {
    await convex.mutation(api.auth.updateUserSubscription, {
      whopUserId: membershipData.user_id,
      subscriptionData: {
        tier: membershipData.product?.tier || "starter",
        subscriptionId: membershipData.id,
        isActive: membershipData.status === "active",
        whopProductId: null,
        expiresAt: null,
        planId: null,
      },
    });
  } catch (error) {
    console.error("Failed to sync subscription:", error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(membershipData: WhopWebhookPayload["data"]) {
  try {
    await convex.mutation(api.auth.updateUserSubscription, {
      whopUserId: membershipData.user_id,
      subscriptionData: {
        tier: "starter",
        subscriptionId: null,
        isActive: false,
        whopProductId: null,
        expiresAt: null,
        planId: null,
      },
    });
  } catch (error) {
    console.error("Failed to handle subscription cancellation:", error);
    throw error;
  }
}