import { createLogger } from './logger';

const logger = createLogger('request-deduplication');

interface DeduplicationOptions {
  timeout?: number; // Timeout for the request in ms
  retries?: number; // Number of retries before tripping the circuit breaker
  retryDelay?: number; // Base delay for exponential backoff
  maxRetryDelay?: number; // Maximum delay for exponential backoff
  circuitBreakerThreshold?: number; // Number of failures to trip the circuit breaker
  circuitBreakerResetTime?: number; // Time in ms to wait before attempting to close the circuit
}

const defaultOptions: Required<DeduplicationOptions> = {
  timeout: 5000,
  retries: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTime: 30000,
};

const inFlightRequests = new Map<string, Promise<unknown>>();
const circuitBreakers = new Map<
  string,
  { failures: number; trippedAt: number | null; isOpen: boolean }
>();

const getBackoffDelay = (
  attempt: number,
  options: Required<DeduplicationOptions>
): number => {
  const delay = options.retryDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  return Math.min(delay + jitter, options.maxRetryDelay);
};

export async function deduplicatedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  options?: DeduplicationOptions
): Promise<T> {
  const opts = { ...defaultOptions, ...options };

  // Check circuit breaker
  const breaker = circuitBreakers.get(key) || {
    failures: 0,
    trippedAt: null,
    isOpen: false,
  };

  if (breaker.isOpen) {
    if (
      breaker.trippedAt &&
      Date.now() - breaker.trippedAt > opts.circuitBreakerResetTime
    ) {
      // Attempt to close the circuit
      logger.warn(`Circuit breaker for ${key} attempting to close.`);
      breaker.isOpen = false;
      breaker.failures = 0;
      breaker.trippedAt = null;
      circuitBreakers.set(key, breaker);
    } else {
      logger.error(`Circuit breaker for ${key} is open. Request blocked.`);
      throw new Error(`Circuit breaker for ${key} is open. Request blocked.`);
    }
  }

  if (inFlightRequests.has(key)) {
    logger.debug(`Deduplicating request for key: ${key}`);
    return inFlightRequests.get(key) as Promise<T>;
  }

  const executeRequest = async (attempt = 0): Promise<T> => {
    try {
      const timeoutPromise = new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), opts.timeout)
      );

      const result = await Promise.race([requestFn(), timeoutPromise]);

      // Reset circuit breaker on success
      if (breaker.failures > 0) {
        breaker.failures = 0;
        breaker.isOpen = false;
        breaker.trippedAt = null;
        circuitBreakers.set(key, breaker);
        logger.info(`Circuit breaker for ${key} reset on success.`);
      }

      return result;
    } catch (error) {
      logger.error(
        `Request for ${key} failed (attempt ${attempt + 1}):`,
        error
      );
      breaker.failures++;

      if (breaker.failures >= opts.circuitBreakerThreshold) {
        breaker.isOpen = true;
        breaker.trippedAt = Date.now();
        circuitBreakers.set(key, breaker);
        logger.error(
          `Circuit breaker for ${key} tripped due to ${breaker.failures} failures.`
        );
        throw new Error(`Circuit breaker for ${key} tripped.`);
      }

      if (attempt < opts.retries) {
        const delay = getBackoffDelay(attempt, opts);
        logger.warn(`Retrying request for ${key} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeRequest(attempt + 1);
      } else {
        throw error;
      }
    }
  };

  const promise = executeRequest();
  inFlightRequests.set(key, promise);

  promise.finally(() => {
    inFlightRequests.delete(key);
  });

  return promise;
}

// Export a class-based approach for more advanced use cases
export class RequestDeduplication {
  private pendingRequests = new Map<string, Promise<unknown>>();
  private circuitBreakers = new Map<
    string,
    { failures: number; trippedAt: number | null; isOpen: boolean }
  >();

  async request<T>(
    key: string,
    requestFn: () => Promise<T>,
    options?: DeduplicationOptions
  ): Promise<T> {
    return deduplicatedRequest(key, requestFn, options);
  }

  clear(key: string): void {
    this.pendingRequests.delete(key);
    this.circuitBreakers.delete(key);
  }

  clearAll(): void {
    this.pendingRequests.clear();
    this.circuitBreakers.clear();
  }

  getStats(): { pendingRequests: number; circuitBreakers: number } {
    return {
      pendingRequests: this.pendingRequests.size,
      circuitBreakers: this.circuitBreakers.size,
    };
  }
}

// Export a singleton instance
export const requestDeduplication = new RequestDeduplication();
