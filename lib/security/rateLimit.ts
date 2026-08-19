// Lightweight process-local guard for expensive authenticated actions such as
// OCR and document rendering. It deliberately has no client-side state, so a
// browser cannot bypass it. For a multi-instance deployment, this module is a
// single replacement point for a shared Redis/Upstash limiter.
import "server-only";

type Limit = { limit: number; windowMs: number };
type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

const attempts = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 10_000;

export function enforceRateLimit(key: string, config: Limit): RateLimitResult {
  const now = Date.now();
  const earliest = now - config.windowMs;
  const recent = (attempts.get(key) ?? []).filter((at) => at > earliest);

  if (recent.length >= config.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + config.windowMs - now) / 1000)),
    };
  }

  recent.push(now);
  attempts.set(key, recent);
  // Bound memory during long-running local/server processes.
  if (attempts.size > MAX_TRACKED_KEYS) {
    for (const [storedKey, stored] of attempts) {
      if (stored.every((at) => at <= earliest)) attempts.delete(storedKey);
      if (attempts.size <= MAX_TRACKED_KEYS) break;
    }
  }
  return { ok: true };
}
