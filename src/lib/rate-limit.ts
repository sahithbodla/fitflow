/**
 * In-memory fixed-window rate limiter for the public enquiry form.
 *
 * Deliberately simple: this MVP runs as a single Render instance, so a shared
 * store would be over-engineering. The trade-off is that limits reset on deploy
 * and are per-instance — if the app is ever scaled horizontally this must move
 * to Redis or a database-backed counter.
 */
type Bucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as typeof globalThis & {
  __fitflowRateLimiter?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> = (globalForLimiter.__fitflowRateLimiter ??=
  new Map());

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  };
}

/** Opportunistic cleanup so the map cannot grow without bound. */
export function pruneRateLimiter(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
