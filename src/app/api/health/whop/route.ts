import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

/**
 * Health Check Endpoint for Whop Integration
 *
 * GET /api/health/whop
 *
 * Returns comprehensive status of Whop integration including:
 * - Environment variable configuration
 * - API connectivity
 * - Webhook configuration
 * - Database connectivity
 * - Credit system status
 */

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details?: any;
    };
  };
  metadata: {
    environment: string;
    version: string;
    uptime: number;
  };
}

// Track service start time for uptime calculation
const serviceStartTime = Date.now();

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
    metadata: {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - serviceStartTime,
    },
  };

  try {
    // 1. Check environment variables
    const envCheck = checkEnvironmentVariables();
    result.checks.environment = envCheck;
    if (envCheck.status === 'fail') result.status = 'unhealthy';
    if (envCheck.status === 'warning' && result.status === 'healthy') {
      result.status = 'degraded';
    }

    // 2. Check Whop API connectivity
    const whopCheck = await checkWhopAPI();
    result.checks.whopAPI = whopCheck;
    if (whopCheck.status === 'fail') result.status = 'unhealthy';

    // 3. Check webhook configuration
    const webhookCheck = checkWebhookConfig();
    result.checks.webhook = webhookCheck;
    if (webhookCheck.status === 'warning' && result.status === 'healthy') {
      result.status = 'degraded';
    }

    // 4. Check Convex database
    const convexCheck = await checkConvexDatabase();
    result.checks.database = convexCheck;
    if (convexCheck.status === 'fail') result.status = 'unhealthy';

    // 5. Check product configuration
    const productCheck = checkProductConfiguration();
    result.checks.products = productCheck;
    if (productCheck.status === 'warning' && result.status === 'healthy') {
      result.status = 'degraded';
    }

    // 6. Check credit system
    const creditCheck = checkCreditSystem();
    result.checks.creditSystem = creditCheck;
    if (creditCheck.status === 'warning' && result.status === 'healthy') {
      result.status = 'degraded';
    }

    // 7. Check external services (Replicate, OpenAI)
    const servicesCheck = await checkExternalServices();
    result.checks.externalServices = servicesCheck;
    if (servicesCheck.status === 'warning' && result.status === 'healthy') {
      result.status = 'degraded';
    }

    // Add response time
    const responseTime = Date.now() - startTime;
    result.checks.responseTime = {
      status: responseTime < 1000 ? 'pass' : responseTime < 3000 ? 'warning' : 'fail',
      message: `Health check completed in ${responseTime}ms`,
      details: { responseTime },
    };

    // Return appropriate status code based on health
    const statusCode = result.status === 'healthy' ? 200 :
                       result.status === 'degraded' ? 200 : 503;

    return NextResponse.json(result, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    result.status = 'unhealthy';
    result.checks.error = {
      status: 'fail',
      message: 'Health check encountered an error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(result, { status: 503 });
  }
}

function checkEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_WHOP_APP_ID',
    'WHOP_API_KEY',
    'NEXT_PUBLIC_CONVEX_URL',
    'REPLICATE_API_TOKEN',
  ];

  const optional = [
    'WHOP_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'CONVEX_DEPLOY_KEY',
  ];

  const missing: string[] = [];
  const placeholders: string[] = [];

  // Check required variables
  for (const varName of required) {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else if (value.includes('your_') || value.includes('fallback') || value === 'xxx') {
      placeholders.push(varName);
    }
  }

  // Check optional variables
  const missingOptional: string[] = [];
  for (const varName of optional) {
    const value = process.env[varName];
    if (!value) {
      missingOptional.push(varName);
    }
  }

  if (missing.length > 0) {
    return {
      status: 'fail' as const,
      message: `Missing required environment variables: ${missing.join(', ')}`,
      details: { missing, placeholders },
    };
  }

  if (placeholders.length > 0) {
    return {
      status: 'warning' as const,
      message: `Using placeholder values for: ${placeholders.join(', ')}`,
      details: { placeholders, missingOptional },
    };
  }

  return {
    status: 'pass' as const,
    message: 'All environment variables configured',
    details: { configured: required.length, optional: missingOptional },
  };
}

async function checkWhopAPI() {
  const apiKey = process.env.WHOP_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    return {
      status: 'fail' as const,
      message: 'Whop API key not configured',
    };
  }

  try {
    const response = await fetch('https://api.whop.com/v5/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      // Short timeout for health check
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return {
        status: 'pass' as const,
        message: 'Whop API connection successful',
        details: { statusCode: response.status },
      };
    }

    if (response.status === 401) {
      return {
        status: 'fail' as const,
        message: 'Invalid Whop API key',
        details: { statusCode: response.status },
      };
    }

    return {
      status: 'warning' as const,
      message: `Whop API returned status ${response.status}`,
      details: { statusCode: response.status },
    };

  } catch (error) {
    return {
      status: 'fail' as const,
      message: 'Failed to connect to Whop API',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkWebhookConfig() {
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      status: 'warning' as const,
      message: 'Webhook secret not configured',
      details: { configured: false },
    };
  }

  if (!webhookSecret.startsWith('whsec_')) {
    return {
      status: 'warning' as const,
      message: 'Webhook secret format may be invalid',
      details: { format: 'unexpected' },
    };
  }

  return {
    status: 'pass' as const,
    message: 'Webhook configuration valid',
    details: { configured: true, format: 'valid' },
  };
}

async function checkConvexDatabase() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return {
      status: 'fail' as const,
      message: 'Convex URL not configured',
    };
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);

    // Try to query billing stats (lightweight query)
    const stats = await convex.query(api.functions.billing.getBillingAnalytics, {});

    return {
      status: 'pass' as const,
      message: 'Convex database connection successful',
      details: {
        totalTransactions: stats.totalTransactions || 0,
        connected: true,
      },
    };

  } catch (error) {
    return {
      status: 'fail' as const,
      message: 'Failed to connect to Convex database',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkProductConfiguration() {
  const products = {
    starter: process.env.NEXT_PUBLIC_WHOP_STARTER_PRODUCT_ID,
    growth: process.env.NEXT_PUBLIC_WHOP_GROWTH_PRODUCT_ID,
    pro: process.env.NEXT_PUBLIC_WHOP_PRO_PRODUCT_ID,
  };

  const plans = {
    small: process.env.WHOP_SMALL_CREDIT_PLAN_ID,
    medium: process.env.WHOP_MEDIUM_CREDIT_PLAN_ID,
    large: process.env.WHOP_LARGE_CREDIT_PLAN_ID,
  };

  const missingProducts: string[] = [];
  const placeholderProducts: string[] = [];

  // Check products
  for (const [tier, id] of Object.entries(products)) {
    if (!id) {
      missingProducts.push(tier);
    } else if (id.includes('xxx') || id.includes('your_')) {
      placeholderProducts.push(tier);
    }
  }

  // Check plans
  const missingPlans: string[] = [];
  const placeholderPlans: string[] = [];

  for (const [size, id] of Object.entries(plans)) {
    if (!id) {
      missingPlans.push(size);
    } else if (id.includes('xxx') || id.includes('your_')) {
      placeholderPlans.push(size);
    }
  }

  const totalMissing = missingProducts.length + missingPlans.length;
  const totalPlaceholders = placeholderProducts.length + placeholderPlans.length;

  if (totalMissing > 0) {
    return {
      status: 'warning' as const,
      message: `Missing ${totalMissing} product/plan configurations`,
      details: {
        missingProducts,
        missingPlans,
        placeholderProducts,
        placeholderPlans,
      },
    };
  }

  if (totalPlaceholders > 0) {
    return {
      status: 'warning' as const,
      message: `${totalPlaceholders} products/plans using placeholders`,
      details: {
        placeholderProducts,
        placeholderPlans,
      },
    };
  }

  return {
    status: 'pass' as const,
    message: 'All products and plans configured',
    details: {
      products: Object.keys(products).length,
      plans: Object.keys(plans).length,
    },
  };
}

function checkCreditSystem() {
  // Check credit pack configuration
  const creditPacks = [
    { env: process.env.WHOP_SMALL_CREDIT_PLAN_ID, name: 'Small (100 credits)' },
    { env: process.env.WHOP_MEDIUM_CREDIT_PLAN_ID, name: 'Medium (500 credits)' },
    { env: process.env.WHOP_LARGE_CREDIT_PLAN_ID, name: 'Large (1000 credits)' },
  ];

  const configured: string[] = [];
  const missing: string[] = [];

  for (const pack of creditPacks) {
    if (pack.env && !pack.env.includes('xxx')) {
      configured.push(pack.name);
    } else {
      missing.push(pack.name);
    }
  }

  if (missing.length === creditPacks.length) {
    return {
      status: 'warning' as const,
      message: 'Credit system not configured',
      details: { configured: 0, missing: missing.length },
    };
  }

  if (missing.length > 0) {
    return {
      status: 'warning' as const,
      message: `Partial credit system configuration`,
      details: { configured, missing },
    };
  }

  return {
    status: 'pass' as const,
    message: 'Credit system fully configured',
    details: { configured, total: creditPacks.length },
  };
}

async function checkExternalServices() {
  const services = {
    replicate: process.env.REPLICATE_API_TOKEN,
    openai: process.env.OPENAI_API_KEY,
  };

  const results: Record<string, string> = {};

  for (const [service, token] of Object.entries(services)) {
    if (!token) {
      results[service] = 'not configured';
    } else if (token.includes('your_') || token.includes('xxx')) {
      results[service] = 'placeholder';
    } else {
      results[service] = 'configured';
    }
  }

  const notConfigured = Object.entries(results)
    .filter(([_, status]) => status === 'not configured')
    .map(([service]) => service);

  const placeholders = Object.entries(results)
    .filter(([_, status]) => status === 'placeholder')
    .map(([service]) => service);

  if (notConfigured.length > 0) {
    return {
      status: 'warning' as const,
      message: `External services not configured: ${notConfigured.join(', ')}`,
      details: results,
    };
  }

  if (placeholders.length > 0) {
    return {
      status: 'warning' as const,
      message: `External services using placeholders: ${placeholders.join(', ')}`,
      details: results,
    };
  }

  return {
    status: 'pass' as const,
    message: 'All external services configured',
    details: results,
  };
}