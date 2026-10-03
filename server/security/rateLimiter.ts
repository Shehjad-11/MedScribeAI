import { Request, Response, NextFunction } from 'express';

/**
 * In-Memory Sliding-Window Rate Limiter Middleware
 * Spec: MASTER_PROMPT Phase 11
 * Enforces per-IP / per-session rate limits on public & kiosk endpoints to prevent denial-of-service.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimiterOptions {
  windowMs?: number; // Time window in milliseconds (default: 60,000 ms = 1 min)
  maxRequests?: number; // Max allowed requests per window (default: 60)
  message?: string;
}

export class InMemoryRateLimiter {
  private hits = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;
  private message: string;

  constructor(options: RateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? 60 * 1000;
    this.maxRequests = options.maxRequests ?? 60;
    this.message = options.message ?? 'Rate limit exceeded. Please try again later.';
  }

  public getMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const now = Date.now();
      // Identify client by token or IP
      const authHeader = req.headers.authorization;
      const clientKey = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : req.ip || req.socket.remoteAddress || 'unknown-client';

      let record = this.hits.get(clientKey);
      if (!record) {
        record = { timestamps: [] };
        this.hits.set(clientKey, record);
      }

      // Filter out timestamps outside window
      const threshold = now - this.windowMs;
      record.timestamps = record.timestamps.filter((ts) => ts > threshold);

      if (record.timestamps.length >= this.maxRequests) {
        const oldestTimestamp = record.timestamps[0];
        const retryAfterSeconds = Math.ceil((oldestTimestamp + this.windowMs - now) / 1000);
        res.setHeader('Retry-After', String(Math.max(1, retryAfterSeconds)));
        return res.status(429).json({
          error: 'Too Many Requests',
          message: this.message,
          retryAfterSeconds: Math.max(1, retryAfterSeconds),
        });
      }

      record.timestamps.push(now);
      next();
    };
  }

  public reset(): void {
    this.hits.clear();
  }
}

// Default export instance for kiosk endpoints
export const kioskRateLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Kiosk request threshold reached. Please wait before attempting further submissions.',
});
