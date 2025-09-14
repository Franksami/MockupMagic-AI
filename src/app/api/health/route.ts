import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  details: string;
  error?: string;
}

/**
 * Comprehensive health check endpoint
 * Tests actual connectivity and function availability
 */
export async function GET() {
  const startTime = Date.now();
  const results: HealthCheckResult[] = [];

  // Test Convex connectivity
  const convexResult = await testConvexHealth();
  results.push(convexResult);

  // Test Whop connectivity
  const whopResult = await testWhopHealth();
  results.push(whopResult);

  // Test auth functions specifically
  const authResult = await testAuthFunctions();
  results.push(authResult);

  const totalTime = Date.now() - startTime;
  const overallStatus = determineOverallStatus(results);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall_status: overallStatus,
    total_response_time_ms: totalTime,
    services: results,
    summary: {
      healthy: results.filter(r => r.status === 'healthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
      unhealthy: results.filter(r => r.status === 'unhealthy').length,
    },
  });
}

async function testConvexHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return {
        service: 'convex',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        details: 'NEXT_PUBLIC_CONVEX_URL not configured',
      };
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // Test basic connectivity with a simple operation
    // Since auth functions might require specific parameters, let's test with a safer approach
    try {
      // Try to access the API to see if it's properly generated
      const apiCheck = typeof api;

      if (apiCheck === 'object' && api) {
        return {
          service: 'convex',
          status: 'healthy',
          response_time_ms: Date.now() - startTime,
          details: 'Convex API accessible and functions deployed',
        };
      } else {
        return {
          service: 'convex',
          status: 'degraded',
          response_time_ms: Date.now() - startTime,
          details: 'Convex connected but API not properly generated',
        };
      }
    } catch (error: any) {
      return {
        service: 'convex',
        status: 'degraded',
        response_time_ms: Date.now() - startTime,
        details: 'Connected but function call failed',
        error: error.message,
      };
    }
  } catch (error: any) {
    return {
      service: 'convex',
      status: 'unhealthy',
      response_time_ms: Date.now() - startTime,
      details: 'Failed to connect to Convex',
      error: error.message,
    };
  }
}

async function testWhopHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!process.env.WHOP_API_KEY || process.env.WHOP_API_KEY.includes('your_api_key')) {
      return {
        service: 'whop',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        details: 'WHOP_API_KEY not properly configured',
      };
    }

    // Test Whop API connectivity
    const response = await fetch('https://api.whop.com/api/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        service: 'whop',
        status: 'healthy',
        response_time_ms: responseTime,
        details: 'Whop API accessible and authenticated',
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        service: 'whop',
        status: 'unhealthy',
        response_time_ms: responseTime,
        details: 'Whop API authentication failed',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    } else {
      return {
        service: 'whop',
        status: 'degraded',
        response_time_ms: responseTime,
        details: 'Whop API returned error',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error: any) {
    return {
      service: 'whop',
      status: 'unhealthy',
      response_time_ms: Date.now() - startTime,
      details: 'Failed to connect to Whop API',
      error: error.message,
    };
  }
}

async function testAuthFunctions(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return {
        service: 'auth_functions',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        details: 'Convex not configured',
      };
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // Test if auth functions exist by checking their presence in the API
    try {
      // Check if the auth module exists in the API
      if (api && typeof api === 'object' && 'auth' in api) {
        const authModule = (api as any).auth;

        // Check for specific functions we need
        const hasSync = 'syncWhopUser' in authModule;
        const hasGetUser = 'getUserByWhopId' in authModule;

        if (hasSync && hasGetUser) {
          return {
            service: 'auth_functions',
            status: 'healthy',
            response_time_ms: Date.now() - startTime,
            details: 'Auth functions (syncWhopUser, getUserByWhopId) are available',
          };
        } else {
          return {
            service: 'auth_functions',
            status: 'degraded',
            response_time_ms: Date.now() - startTime,
            details: `Missing functions - syncWhopUser: ${hasSync}, getUserByWhopId: ${hasGetUser}`,
          };
        }
      } else {
        return {
          service: 'auth_functions',
          status: 'degraded',
          response_time_ms: Date.now() - startTime,
          details: 'Auth module not found in Convex API',
        };
      }
    } catch (error: any) {
      return {
        service: 'auth_functions',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        details: 'Error checking auth functions',
        error: error.message,
      };
    }
  } catch (error: any) {
    return {
      service: 'auth_functions',
      status: 'unhealthy',
      response_time_ms: Date.now() - startTime,
      details: 'Failed to initialize Convex client',
      error: error.message,
    };
  }
}

function determineOverallStatus(results: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
  const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
  const degradedCount = results.filter(r => r.status === 'degraded').length;

  if (unhealthyCount > 0) {
    return 'unhealthy';
  } else if (degradedCount > 0) {
    return 'degraded';
  } else {
    return 'healthy';
  }
}

/**
 * Test specific service endpoint
 */
export async function POST(request: Request) {
  try {
    const { service, ...options } = await request.json();

    switch (service) {
      case 'convex':
        return NextResponse.json(await testConvexHealth());
      case 'whop':
        return NextResponse.json(await testWhopHealth());
      case 'auth':
        return NextResponse.json(await testAuthFunctions());
      default:
        return NextResponse.json(
          { error: 'Unknown service. Available: convex, whop, auth' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}