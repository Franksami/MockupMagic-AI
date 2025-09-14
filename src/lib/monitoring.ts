/**
 * Request Tracking and Performance Monitoring System
 * Provides comprehensive observability for debugging and optimization
 */

// Request tracking interface
export interface RequestTrace {
  requestId: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  userId?: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, any>;
  error?: {
    category: string;
    message: string;
    stack?: string;
  };
}

// Performance metrics interface
export interface PerformanceMetrics {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  errorRate: number;
  lastUpdated: number;
  p95Duration?: number;
  p99Duration?: number;
}

/**
 * Request tracking and monitoring class
 */
export class RequestMonitor {
  private static traces = new Map<string, RequestTrace>();
  private static metrics = new Map<string, PerformanceMetrics>();
  private static readonly MAX_TRACES = 1000; // Prevent memory leaks
  private static readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  private static lastCleanup = Date.now();

  /**
   * Start tracking a request
   */
  static startRequest(
    operation: string,
    context?: {
      userId?: string;
      userAgent?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  ): string {
    const requestId = this.generateRequestId();
    const trace: RequestTrace = {
      requestId,
      operation,
      startTime: Date.now(),
      status: 'pending',
      ...context,
    };

    this.traces.set(requestId, trace);
    this.cleanupIfNeeded();

    return requestId;
  }

  /**
   * Complete a request with success
   */
  static completeRequest(requestId: string, metadata?: Record<string, any>): void {
    const trace = this.traces.get(requestId);
    if (!trace) {
      console.warn(`[MONITOR] Request ${requestId} not found for completion`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - trace.startTime;

    trace.endTime = endTime;
    trace.duration = duration;
    trace.status = 'success';
    if (metadata) {
      trace.metadata = { ...trace.metadata, ...metadata };
    }

    this.updateMetrics(trace);

    // Log performance for slow operations
    if (duration > 5000) {
      console.warn(`[SLOW REQUEST] ${trace.operation} took ${duration}ms (ID: ${requestId})`);
    }
  }

  /**
   * Complete a request with error
   */
  static errorRequest(
    requestId: string,
    error: unknown,
    metadata?: Record<string, any>
  ): void {
    const trace = this.traces.get(requestId);
    if (!trace) {
      console.warn(`[MONITOR] Request ${requestId} not found for error completion`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - trace.startTime;

    trace.endTime = endTime;
    trace.duration = duration;
    trace.status = 'error';
    trace.error = {
      category: error instanceof Error ? 'Error' : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    if (metadata) {
      trace.metadata = { ...trace.metadata, ...metadata };
    }

    this.updateMetrics(trace);

    console.error(`[ERROR REQUEST] ${trace.operation} failed after ${duration}ms (ID: ${requestId}):`, trace.error.message);
  }

  /**
   * Get request trace by ID
   */
  static getTrace(requestId: string): RequestTrace | undefined {
    return this.traces.get(requestId);
  }

  /**
   * Get all traces for an operation
   */
  static getOperationTraces(operation: string): RequestTrace[] {
    return Array.from(this.traces.values()).filter(trace => trace.operation === operation);
  }

  /**
   * Get performance metrics for an operation
   */
  static getMetrics(operation: string): PerformanceMetrics | undefined {
    return this.metrics.get(operation);
  }

  /**
   * Get all performance metrics
   */
  static getAllMetrics(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Update performance metrics
   */
  private static updateMetrics(trace: RequestTrace): void {
    if (!trace.duration) return;

    const existing = this.metrics.get(trace.operation);

    if (!existing) {
      this.metrics.set(trace.operation, {
        operation: trace.operation,
        count: 1,
        avgDuration: trace.duration,
        minDuration: trace.duration,
        maxDuration: trace.duration,
        successRate: trace.status === 'success' ? 1 : 0,
        errorRate: trace.status === 'error' ? 1 : 0,
        lastUpdated: Date.now(),
      });
    } else {
      const newCount = existing.count + 1;
      const newAvg = (existing.avgDuration * existing.count + trace.duration) / newCount;
      const newSuccesses = existing.successRate * existing.count + (trace.status === 'success' ? 1 : 0);
      const newErrors = existing.errorRate * existing.count + (trace.status === 'error' ? 1 : 0);

      this.metrics.set(trace.operation, {
        ...existing,
        count: newCount,
        avgDuration: newAvg,
        minDuration: Math.min(existing.minDuration, trace.duration),
        maxDuration: Math.max(existing.maxDuration, trace.duration),
        successRate: newSuccesses / newCount,
        errorRate: newErrors / newCount,
        lastUpdated: Date.now(),
      });
    }
  }

  /**
   * Generate unique request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Cleanup old traces to prevent memory leaks
   */
  private static cleanupIfNeeded(): void {
    const now = Date.now();

    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) {
      return;
    }

    if (this.traces.size > this.MAX_TRACES) {
      const oldestTraces = Array.from(this.traces.entries())
        .sort(([, a], [, b]) => a.startTime - b.startTime)
        .slice(0, this.traces.size - this.MAX_TRACES + 100); // Remove oldest + buffer

      for (const [id] of oldestTraces) {
        this.traces.delete(id);
      }

      console.info(`[MONITOR] Cleaned up ${oldestTraces.length} old request traces`);
    }

    this.lastCleanup = now;
  }

  /**
   * Get system health overview
   */
  static getHealthOverview(): {
    totalRequests: number;
    avgSuccessRate: number;
    avgResponseTime: number;
    operationsCount: number;
    alertsTriggered: string[];
  } {
    const allMetrics = Array.from(this.metrics.values());
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.count, 0);
    const avgSuccessRate = allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length || 0;
    const avgResponseTime = allMetrics.reduce((sum, m) => sum + m.avgDuration, 0) / allMetrics.length || 0;

    // Check for performance alerts
    const alerts: string[] = [];
    for (const metric of allMetrics) {
      if (metric.successRate < 0.9) {
        alerts.push(`Low success rate: ${metric.operation} (${(metric.successRate * 100).toFixed(1)}%)`);
      }
      if (metric.avgDuration > 5000) {
        alerts.push(`Slow operation: ${metric.operation} (${metric.avgDuration.toFixed(0)}ms avg)`);
      }
      if (metric.errorRate > 0.1) {
        alerts.push(`High error rate: ${metric.operation} (${(metric.errorRate * 100).toFixed(1)}%)`);
      }
    }

    return {
      totalRequests,
      avgSuccessRate,
      avgResponseTime,
      operationsCount: allMetrics.length,
      alertsTriggered: alerts,
    };
  }

  /**
   * Export traces for external monitoring (Sentry, DataDog, etc.)
   */
  static exportTraces(filter?: {
    operation?: string;
    status?: RequestTrace['status'];
    minDuration?: number;
    since?: number;
  }): RequestTrace[] {
    let traces = Array.from(this.traces.values());

    if (filter) {
      if (filter.operation) {
        traces = traces.filter(t => t.operation === filter.operation);
      }
      if (filter.status) {
        traces = traces.filter(t => t.status === filter.status);
      }
      if (filter.minDuration) {
        traces = traces.filter(t => (t.duration || 0) >= filter.minDuration!);
      }
      if (filter.since) {
        traces = traces.filter(t => t.startTime >= filter.since!);
      }
    }

    return traces.sort((a, b) => b.startTime - a.startTime);
  }
}

/**
 * Higher-order function to automatically track API route performance
 */
export function withRequestTracking<T extends any[], R>(
  operation: string,
  handler: (requestId: string, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const requestId = RequestMonitor.startRequest(operation);

    try {
      const result = await handler(requestId, ...args);
      RequestMonitor.completeRequest(requestId);
      return result;
    } catch (error) {
      RequestMonitor.errorRequest(requestId, error);
      throw error;
    }
  };
}

/**
 * Middleware for Next.js API routes
 */
export function createMonitoringMiddleware(operation: string) {
  return function monitoringMiddleware<T extends any[]>(
    handler: (request: Request, ...args: T) => Promise<Response>
  ) {
    return async (request: Request, ...args: T): Promise<Response> => {
      const requestId = RequestMonitor.startRequest(operation, {
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
      });

      try {
        const response = await handler(request, ...args);

        RequestMonitor.completeRequest(requestId, {
          httpStatus: response.status,
          responseSize: response.headers.get('content-length'),
        });

        // Add request ID to response headers for debugging
        response.headers.set('x-request-id', requestId);

        return response;
      } catch (error) {
        RequestMonitor.errorRequest(requestId, error);
        throw error;
      }
    };
  };
}