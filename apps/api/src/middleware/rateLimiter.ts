import { Request, Response, NextFunction } from 'express';

// Express Rate Limiting Middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000,
  keyFn: (req: Request) => string = (req) => req.ip || '127.0.0.1',
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req);
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${limit} requests allowed per 15 minutes.`,
        retryAfterMs: record.resetTime - now
      });
    }

    record.count++;
    next();
  };
}
