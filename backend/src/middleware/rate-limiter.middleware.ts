import type { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message: string;
}

export const rateLimiter = (options: RateLimiterOptions) => {
  const limiter = new RateLimiterMemory({
    points: options.max,
    duration: options.windowMs / 1000,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use IP address as key for rate limiting
      const key =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "unknown";

      // Add path to key to separate rate limits for different endpoints
      const rateLimitKey = `${key}:${req.path}`;

      await limiter.consume(rateLimitKey);
      next();
    } catch (error) {
      res.status(429).json({ message: options.message });
    }
  };
};
