/**
 * Rate Limiter và Circuit Breaker cho Gemini API
 * Giúp tránh spam API và xử lý lỗi một cách thông minh
 */

import { logWithTimestamp, logErrorWithTimestamp, logWarnWithTimestamp } from './logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitorWindowMs: number;
}

class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Loại bỏ các request cũ ngoài window
    this.requests = this.requests.filter(time => now - time < this.config.windowMs);
    
    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.config.windowMs - (now - oldestRequest);
      
      logWarnWithTimestamp(`🚦 Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }
    
    this.requests.push(now);
    return true;
  }

  getStatus() {
    const now = Date.now();
    const activeRequests = this.requests.filter(time => now - time < this.config.windowMs);
    return {
      activeRequests: activeRequests.length,
      maxRequests: this.config.maxRequests,
      windowMs: this.config.windowMs
    };
  }
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;
  private recentErrors: string[] = [];

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        logWithTimestamp('🔄 Circuit breaker moving to HALF_OPEN state');
      } else {
        const waitTime = this.config.resetTimeoutMs - (Date.now() - this.lastFailureTime);
        throw new Error(`Circuit breaker is OPEN. Try again in ${Math.ceil(waitTime / 1000)}s`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.recentErrors = [];
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      logWithTimestamp('✅ Circuit breaker reset to CLOSED state');
    }
  }

  private onFailure(error: Error) {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.recentErrors.push(error.message);
    
    // Giữ chỉ 10 lỗi gần nhất
    if (this.recentErrors.length > 10) {
      this.recentErrors = this.recentErrors.slice(-10);
    }

    logErrorWithTimestamp(`❌ Circuit breaker failure ${this.failures}/${this.config.failureThreshold}:`, error.message);

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      logErrorWithTimestamp(`🚫 Circuit breaker OPEN after ${this.failures} failures`);
      logErrorWithTimestamp('Recent errors:', this.recentErrors);
    }
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      recentErrors: this.recentErrors.slice(-3) // Chỉ hiển thị 3 lỗi gần nhất
    };
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.recentErrors = [];
    logWithTimestamp('🔄 Circuit breaker manually reset');
  }
}

// Singleton instances cho Gemini API
const geminiRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 requests
  windowMs: 60000, // per minute
  retryAfterMs: 1000
});

const geminiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5, // 5 failures
  resetTimeoutMs: 300000, // 5 minutes
  monitorWindowMs: 60000 // 1 minute
});

// Export functions
export async function withRateLimit<T>(operation: () => Promise<T>): Promise<T> {
  await geminiRateLimiter.checkLimit();
  return operation();
}

export async function withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
  return geminiCircuitBreaker.execute(operation);
}

export async function withProtection<T>(operation: () => Promise<T>): Promise<T> {
  return withRateLimit(() => withCircuitBreaker(operation));
}

export function getRateLimiterStatus() {
  return geminiRateLimiter.getStatus();
}

export function getCircuitBreakerStatus() {
  return geminiCircuitBreaker.getStatus();
}

export function resetCircuitBreaker() {
  geminiCircuitBreaker.reset();
}

export function getProtectionStatus() {
  return {
    rateLimiter: getRateLimiterStatus(),
    circuitBreaker: getCircuitBreakerStatus()
  };
}