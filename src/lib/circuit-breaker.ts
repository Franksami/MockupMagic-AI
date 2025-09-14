/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures when external services are down
 */

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Service is failing, requests are rejected
  HALF_OPEN = 'half_open' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  timeoutMs: number;          // Request timeout
  resetTimeoutMs: number;     // Time before attempting to close circuit
  monitoringPeriodMs: number; // Rolling window for failure counting
}

export interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number; // For half-open state
}

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 3,
  timeoutMs: 5000,
  resetTimeoutMs: 60000, // 1 minute
  monitoringPeriodMs: 60000, // 1 minute
};

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...defaultConfig, ...config };
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      successCount: 0,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if circuit should be closed (reset)
    if (this.shouldReset(now)) {
      this.reset();
    }

    // Reject if circuit is open
    if (this.state.state === CircuitState.OPEN) {
      throw new Error(`Circuit breaker [${this.name}] is OPEN. Service unavailable.`);
    }

    try {
      // Execute operation with timeout
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    if (this.state.state === CircuitState.HALF_OPEN) {
      this.state.successCount++;
      // If we get 2 successful requests in half-open, close the circuit
      if (this.state.successCount >= 2) {
        this.reset();
      }
    } else if (this.state.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.state.failureCount = 0;
    }
  }

  private onFailure(error: unknown): void {
    const now = Date.now();
    this.state.failureCount++;
    this.state.lastFailureTime = now;

    console.warn(`Circuit breaker [${this.name}] failure ${this.state.failureCount}/${this.config.failureThreshold}:`, error);

    if (this.state.state === CircuitState.HALF_OPEN) {
      // Failure in half-open state, go back to open
      this.state.state = CircuitState.OPEN;
      this.state.nextAttemptTime = now + this.config.resetTimeoutMs;
    } else if (this.state.failureCount >= this.config.failureThreshold) {
      // Too many failures, open the circuit
      this.state.state = CircuitState.OPEN;
      this.state.nextAttemptTime = now + this.config.resetTimeoutMs;
      console.error(`Circuit breaker [${this.name}] OPENED due to ${this.state.failureCount} failures`);
    }
  }

  private shouldReset(now: number): boolean {
    return (
      this.state.state === CircuitState.OPEN &&
      now >= this.state.nextAttemptTime
    );
  }

  private reset(): void {
    console.info(`Circuit breaker [${this.name}] transitioning to HALF_OPEN for testing`);
    this.state.state = CircuitState.HALF_OPEN;
    this.state.failureCount = 0;
    this.state.successCount = 0;
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  isAvailable(): boolean {
    const now = Date.now();
    if (this.shouldReset(now)) {
      return true; // Will be half-open, which allows requests
    }
    return this.state.state !== CircuitState.OPEN;
  }

  // Force circuit to closed state (for testing or manual reset)
  forceClose(): void {
    this.state.state = CircuitState.CLOSED;
    this.state.failureCount = 0;
    this.state.successCount = 0;
    this.state.lastFailureTime = 0;
    this.state.nextAttemptTime = 0;
    console.info(`Circuit breaker [${this.name}] manually closed`);
  }
}

// Global circuit breaker instances
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, config));
  }
  return circuitBreakers.get(name)!;
}

// Convenience function for Convex operations
export function getConvexCircuitBreaker(): CircuitBreaker {
  return getCircuitBreaker('convex', {
    failureThreshold: 3,
    timeoutMs: 5000,
    resetTimeoutMs: 30000, // 30 seconds for Convex
  });
}

// Convenience function for Whop operations
export function getWhopCircuitBreaker(): CircuitBreaker {
  return getCircuitBreaker('whop', {
    failureThreshold: 2,
    timeoutMs: 10000, // Whop API can be slower
    resetTimeoutMs: 60000, // 1 minute for Whop
  });
}