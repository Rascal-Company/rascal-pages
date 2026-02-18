type TimestampList = number[];

export class RateLimiter {
  private readonly windows = new Map<string, TimestampList>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(opts: { maxRequests: number; windowMs: number }) {
    this.maxRequests = opts.maxRequests;
    this.windowMs = opts.windowMs;
  }

  check(key: string, now = Date.now()): { allowed: boolean } {
    const cutoff = now - this.windowMs;

    const timestamps = this.windows.get(key);
    if (timestamps) {
      const valid = timestamps.filter((t) => t > cutoff);

      if (valid.length >= this.maxRequests) {
        this.windows.set(key, valid);
        return { allowed: false };
      }

      valid.push(now);
      this.windows.set(key, valid);
    } else {
      this.windows.set(key, [now]);
    }

    this.cleanup(cutoff);
    return { allowed: true };
  }

  private cleanup(cutoff: number): void {
    for (const [key, timestamps] of this.windows) {
      const valid = timestamps.filter((t) => t > cutoff);
      if (valid.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, valid);
      }
    }
  }
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const ipLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: FIFTEEN_MINUTES,
});

export const ipSiteLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: FIFTEEN_MINUTES,
});
