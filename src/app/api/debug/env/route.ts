import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint for environment variable audit
 * Helps identify configuration issues with Convex, Whop, and other services
 */
export async function GET() {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Diagnostics not available in production' },
      { status: 403 }
    );
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      convex: {
        configured: false,
        issues: [] as string[],
        variables: {
          NEXT_PUBLIC_CONVEX_URL: {
            present: !!process.env.NEXT_PUBLIC_CONVEX_URL,
            value: process.env.NEXT_PUBLIC_CONVEX_URL ?
              (process.env.NEXT_PUBLIC_CONVEX_URL.includes('your-convex-deployment') ?
                'PLACEHOLDER_URL' : 'CONFIGURED') : 'MISSING',
          },
          CONVEX_DEPLOY_KEY: {
            present: !!process.env.CONVEX_DEPLOY_KEY,
            value: process.env.CONVEX_DEPLOY_KEY ? 'SET' : 'MISSING',
          },
        },
      },
      whop: {
        configured: false,
        issues: [] as string[],
        variables: {
          NEXT_PUBLIC_WHOP_APP_ID: {
            present: !!process.env.NEXT_PUBLIC_WHOP_APP_ID,
            value: process.env.NEXT_PUBLIC_WHOP_APP_ID ?
              (process.env.NEXT_PUBLIC_WHOP_APP_ID.includes('your_whop_app_id') ?
                'PLACEHOLDER_VALUE' : 'CONFIGURED') : 'MISSING',
          },
          WHOP_API_KEY: {
            present: !!process.env.WHOP_API_KEY,
            value: process.env.WHOP_API_KEY ?
              (process.env.WHOP_API_KEY.includes('your_api_key') ?
                'PLACEHOLDER_VALUE' : 'CONFIGURED') : 'MISSING',
          },
          WHOP_WEBHOOK_SECRET: {
            present: !!process.env.WHOP_WEBHOOK_SECRET,
            value: process.env.WHOP_WEBHOOK_SECRET ?
              (process.env.WHOP_WEBHOOK_SECRET.includes('your_webhook_secret') ?
                'PLACEHOLDER_VALUE' : 'CONFIGURED') : 'MISSING',
          },
        },
      },
      other: {
        REPLICATE_API_TOKEN: {
          present: !!process.env.REPLICATE_API_TOKEN,
          value: process.env.REPLICATE_API_TOKEN ? 'SET' : 'MISSING',
        },
        OPENAI_API_KEY: {
          present: !!process.env.OPENAI_API_KEY,
          value: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
        },
      },
    },
    recommendations: [] as string[],
  };

  // Analyze Convex configuration
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    diagnostics.services.convex.issues.push('NEXT_PUBLIC_CONVEX_URL is not set');
    diagnostics.recommendations.push('Run `npx convex dev` to create a development deployment');
  } else if (convexUrl.includes('your-convex-deployment')) {
    diagnostics.services.convex.issues.push('NEXT_PUBLIC_CONVEX_URL contains placeholder value');
    diagnostics.recommendations.push('Replace placeholder URL with actual Convex deployment URL');
  } else {
    diagnostics.services.convex.configured = true;
  }

  if (!process.env.CONVEX_DEPLOY_KEY) {
    diagnostics.services.convex.issues.push('CONVEX_DEPLOY_KEY is not set (needed for deployment)');
  }

  // Analyze Whop configuration
  const whopAppId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  const whopApiKey = process.env.WHOP_API_KEY;
  const whopWebhookSecret = process.env.WHOP_WEBHOOK_SECRET;

  if (!whopAppId || whopAppId.includes('your_whop_app_id')) {
    diagnostics.services.whop.issues.push('NEXT_PUBLIC_WHOP_APP_ID is missing or contains placeholder');
  }
  if (!whopApiKey || whopApiKey.includes('your_api_key')) {
    diagnostics.services.whop.issues.push('WHOP_API_KEY is missing or contains placeholder');
  }
  if (!whopWebhookSecret || whopWebhookSecret.includes('your_webhook_secret')) {
    diagnostics.services.whop.issues.push('WHOP_WEBHOOK_SECRET is missing or contains placeholder');
  }

  if (diagnostics.services.whop.issues.length === 0) {
    diagnostics.services.whop.configured = true;
  } else {
    diagnostics.recommendations.push('Configure Whop credentials in .env.local');
    diagnostics.recommendations.push('Copy .env.example to .env.local and fill in actual values');
  }

  // Overall health assessment
  const overallHealth = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    critical_issues: 0,
    minor_issues: 0,
  };

  const allIssues = [
    ...diagnostics.services.convex.issues,
    ...diagnostics.services.whop.issues,
  ];

  overallHealth.critical_issues = allIssues.length;
  overallHealth.status = overallHealth.critical_issues > 0 ?
    (overallHealth.critical_issues > 2 ? 'unhealthy' : 'degraded') : 'healthy';

  return NextResponse.json({
    ...diagnostics,
    health: overallHealth,
    next_steps: diagnostics.recommendations.length > 0 ?
      diagnostics.recommendations :
      ['Environment appears to be configured correctly'],
  });
}

/**
 * Test specific service connectivity
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Diagnostics not available in production' },
      { status: 403 }
    );
  }

  try {
    const { service } = await request.json();

    switch (service) {
      case 'convex':
        return await testConvexConnectivity();
      case 'whop':
        return await testWhopConnectivity();
      default:
        return NextResponse.json(
          { error: 'Unknown service' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

async function testConvexConnectivity() {
  try {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return NextResponse.json({
        service: 'convex',
        status: 'unconfigured',
        message: 'NEXT_PUBLIC_CONVEX_URL not set',
      });
    }

    if (process.env.NEXT_PUBLIC_CONVEX_URL.includes('your-convex-deployment')) {
      return NextResponse.json({
        service: 'convex',
        status: 'misconfigured',
        message: 'Placeholder URL detected',
      });
    }

    // Dynamic import to avoid module load issues
    const { ConvexHttpClient } = await import('convex/browser');
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // Try a simple query (this will fail gracefully if no functions exist)
    try {
      // Note: This might fail if the functions don't exist, but it will tell us about connectivity
      await client.query('system:ping' as never);
      return NextResponse.json({
        service: 'convex',
        status: 'connected',
        message: 'Successfully connected to Convex',
      });
    } catch (queryError: unknown) {
      // Even if the query fails, if we get a specific Convex error, it means we connected
      if ((queryError as Error).message?.includes('Unknown function') || (queryError as Error).message?.includes('system:ping')) {
        return NextResponse.json({
          service: 'convex',
          status: 'connected',
          message: 'Connected to Convex (functions may not be deployed)',
        });
      }
      throw queryError;
    }
  } catch (error: unknown) {
    return NextResponse.json({
      service: 'convex',
      status: 'error',
      message: (error as Error).message || 'Failed to connect to Convex',
    });
  }
}

async function testWhopConnectivity() {
  try {
    if (!process.env.WHOP_API_KEY || process.env.WHOP_API_KEY.includes('your_api_key')) {
      return NextResponse.json({
        service: 'whop',
        status: 'unconfigured',
        message: 'WHOP_API_KEY not properly configured',
      });
    }

    // Test Whop API connectivity with a simple request
    const response = await fetch('https://api.whop.com/api/v2/me', {
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        service: 'whop',
        status: 'connected',
        message: 'Successfully connected to Whop API',
      });
    } else {
      return NextResponse.json({
        service: 'whop',
        status: 'auth_error',
        message: `Whop API returned ${response.status}: ${response.statusText}`,
      });
    }
  } catch (error: unknown) {
    return NextResponse.json({
      service: 'whop',
      status: 'error',
      message: (error as Error).message || 'Failed to connect to Whop API',
    });
  }
}