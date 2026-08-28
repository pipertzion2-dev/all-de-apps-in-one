type RateLimitEntry = { count: number; reset: number };

const buckets = new Map<string, RateLimitEntry>();

/** In-memory sliding window rate limiter for auth and sensitive endpoints. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.reset - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
