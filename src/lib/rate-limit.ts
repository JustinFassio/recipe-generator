interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(options: RateLimitOptions) {
  return (handler: (req: Request, res: Response) => Promise<void>) => {
    return async (req: Request, res: Response) => {
      const key = options.keyGenerator(req);
      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Clean up old entries
      Object.keys(store).forEach((k) => {
        if (store[k].resetTime < windowStart) {
          delete store[k];
        }
      });

      // Get or create entry for this key
      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 0,
          resetTime: now + options.windowMs,
        };
      }

      // Check if limit exceeded
      if (store[key].count >= options.max) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
        });
      }

      // Increment counter
      store[key].count++;

      // Continue to handler
      return handler(req, res);
    };
  };
}

/**
 * Create a simple rate limiter for image generation
 */
export function createImageGenerationRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    keyGenerator: (req) => {
      // Use user ID if available, otherwise IP
      return (
        (req.headers.get('x-user-id') as string) ||
        (req.headers.get('x-forwarded-for') as string) ||
        'anonymous'
      );
    },
  });
}
