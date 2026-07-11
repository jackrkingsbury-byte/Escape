/**
 * Minimal in-memory sliding-window rate limiter for serverless routes.
 * Best-effort by design: each serverless instance keeps its own counters,
 * which is fine here — the goal is to stop someone hammering the public
 * demo and burning AI credit, not bank-grade quotas.
 */

type Window = number[];

const buckets = new Map<string, Window>();
const MAX_BUCKETS = 5000; // memory guard

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size > MAX_BUCKETS) buckets.clear();

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    const oldest = Math.min(...hits);
    return { allowed: false, retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
