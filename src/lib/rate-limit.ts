/**
 * Fixed-window, in-memory rate limiter. Per process: on serverless hosting each
 * instance counts separately, so treat it as a brake against accidents and
 * casual abuse, not as a hard guarantee.
 *
 * `peek` reads without counting, `hit` counts, `reset` forgets a key. Splitting
 * them lets callers count only what should count (failed logins, successful
 * searches) instead of every attempt.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { count: number; resetAt: number }>();

  const live = (key: string, now: number) => {
    const current = windows.get(key);
    return current && now < current.resetAt ? current : undefined;
  };

  const verdict = (key: string, now: number) => {
    const current = live(key, now);
    return current && current.count >= limit
      ? { allowed: false, retryAfterMs: current.resetAt - now }
      : { allowed: true, retryAfterMs: 0 };
  };

  return {
    /** Whether `key` may proceed, without counting a hit. */
    peek: (key: string, now = Date.now()) => verdict(key, now),

    /** Counts one hit for `key`. */
    hit(key: string, now = Date.now()) {
      const current = live(key, now);
      if (current) {
        current.count += 1;
        return;
      }
      // Opportunistic cleanup so the map cannot grow without bound.
      if (windows.size > 1000) {
        for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
      }
      windows.set(key, { count: 1, resetAt: now + windowMs });
    },

    reset(key: string) {
      windows.delete(key);
    },
  };
}
