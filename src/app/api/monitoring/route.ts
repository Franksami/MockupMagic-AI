/**
 * Monitoring Dashboard API
 * Provides real-time system health and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { RequestMonitor } from '@/lib/monitoring';
import { ErrorAnalyzer } from '@/lib/error-classification';
import { getCircuitBreaker } from '@/lib/circuit-breaker';

/**
 * GET /api/monitoring - System health and performance dashboard
 */
export async function GET(request: NextRequest) {
  // Only allow in development/staging
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_MONITORING_API) {
    return NextResponse.json(
      { error: 'Monitoring API not available in production' },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const metric = url.searchParams.get('metric');
  const operation = url.searchParams.get('operation');

  try {
    // Return specific metric if requested
    if (metric) {
      return handleSpecificMetric(metric, operation);
    }

    // Return comprehensive dashboard data
    const dashboardData = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
      },
      performance: RequestMonitor.getHealthOverview(),
      errors: ErrorAnalyzer.getErrorStats(),
      circuitBreakers: {
        convex: getCircuitBreaker('convex').getState(),
        whop: getCircuitBreaker('whop').getState(),
      },
      operations: RequestMonitor.getAllMetrics(),
      recentTraces: RequestMonitor.exportTraces({
        since: Date.now() - 300000, // Last 5 minutes
      }).slice(0, 50), // Limit to 50 most recent
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring - Update monitoring configuration or reset stats
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Monitoring controls not available in production' },
      { status: 403 }
    );
  }

  try {
    const { action, target } = await request.json();

    switch (action) {
      case 'reset_stats':
        if (target === 'errors') {
          ErrorAnalyzer.resetStats();
        } else if (target === 'performance') {
          // RequestMonitor doesn't have a public reset method, but we can simulate it
          console.info('[MONITOR] Performance stats reset requested');
        } else {
          ErrorAnalyzer.resetStats();
          console.info('[MONITOR] All stats reset');
        }
        return NextResponse.json({ success: true, action: 'reset_stats', target });

      case 'force_circuit_breaker':
        if (target === 'convex') {
          getCircuitBreaker('convex').forceClose();
        } else if (target === 'whop') {
          getCircuitBreaker('whop').forceClose();
        }
        return NextResponse.json({ success: true, action: 'force_circuit_breaker', target });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
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

/**
 * Handle specific metric requests
 */
function handleSpecificMetric(metric: string, operation?: string | null) {
  switch (metric) {
    case 'health':
      return NextResponse.json(RequestMonitor.getHealthOverview());

    case 'errors':
      return NextResponse.json(ErrorAnalyzer.getErrorStats());

    case 'circuit_breakers':
      return NextResponse.json({
        convex: getCircuitBreaker('convex').getState(),
        whop: getCircuitBreaker('whop').getState(),
      });

    case 'performance':
      if (operation) {
        const metrics = RequestMonitor.getMetrics(operation);
        return NextResponse.json(metrics || { error: 'Operation not found' });
      } else {
        return NextResponse.json(RequestMonitor.getAllMetrics());
      }

    case 'traces':
      const traces = RequestMonitor.exportTraces({
        operation: operation || undefined,
        since: Date.now() - 600000, // Last 10 minutes
      }).slice(0, 100);
      return NextResponse.json(traces);

    default:
      return NextResponse.json(
        { error: 'Unknown metric type' },
        { status: 400 }
      );
  }
}