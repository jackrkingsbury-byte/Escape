/**
 * Minimal in-memory sliding-window rate limiter for serverless routes.
 * Best-effort by design: each serverless instance keeps its own counters,
 * which is fine here — the goal is to stop someone hammering the public
 * demo and burning AI credit, not bank-grade quotas.
 */

/** Hit timestamps (ms) for one key, oldest first. */
type Window = number[];

/** Longest window any caller uses; entries older than this are always dead. */
const MAX_WINDOW_MS = 60 * 60_000;
const MAX_BUCKETS = 5000; // memory guard

const buckets = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Drop buckets whose newest hit has aged out.
 *
 * This runs instead of wiping the whole map. A blanket `clear()` would let
 * anyone lift an active limit on demand: spray requests across 5000 junk keys
 * and every real counter — including the global demo budget — resets to zero.
 * Evicting only genuinely-expired entries keeps live limits enforced.
 */
function evictExpired(now: number): void {
  const deadline = now - MAX_WINDOW_MS;
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || hits[hits.length - 1] <= deadline) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size > MAX_BUCKETS) {
    evictExpired(now);
    // Still full of live counters: refuse new keys rather than reset existing
    // ones. Failing closed costs a stranger one request; failing open costs
    // the AI budget this limiter exists to protect.
    if (buckets.size > MAX_BUCKETS && !buckets.has(key)) {
      return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    // hits is ascending, so the oldest live hit is first — it frees a slot
    // once it leaves the window.
    const oldest = hits[0];
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test-only: drop all counters so cases can't leak into each other. */
export function __resetRateLimitForTests(): void {
  buckets.clear();
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
