import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, RateLimitRecord>();
  private readonly windowMs = 60 * 1000;
  private readonly maxRequests = 60;

  use(req: Request, res: Response, next: NextFunction) {
    const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0].trim())
      || req.ip
      || req.connection.remoteAddress
      || 'unknown';
    const now = Date.now();

    if (this.requests.size > 10000) {
      for (const [key, record] of this.requests) {
        if (now > record.resetTime) {
          this.requests.delete(key);
        }
      }
    }

    const record = this.requests.get(ip);

    if (!record || now > record.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + this.windowMs });
      return next();
    }

    if (record.count >= this.maxRequests) {
      return res.status(429).json({
        code: 429,
        message: '请求过于频繁，请稍后再试',
      });
    }

    record.count++;
    next();
  }
}
