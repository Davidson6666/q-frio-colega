import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("blocks only after `limit` hits", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    for (let i = 0; i < 3; i++) {
      expect(limiter.peek("a", i).allowed).toBe(true);
      limiter.hit("a", i);
    }
    const blocked = limiter.peek("a", 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(997);
  });

  it("peek does not count", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    for (let i = 0; i < 10; i++) limiter.peek("a", 0);
    expect(limiter.peek("a", 0).allowed).toBe(true);
  });

  it("counts keys independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.hit("a", 0);
    expect(limiter.peek("a", 1).allowed).toBe(false);
    expect(limiter.peek("b", 1).allowed).toBe(true);
  });

  it("opens a fresh window after it expires", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.hit("a", 0);
    expect(limiter.peek("a", 500).allowed).toBe(false);
    expect(limiter.peek("a", 1000).allowed).toBe(true);
    limiter.hit("a", 1000);
    expect(limiter.peek("a", 1001).allowed).toBe(false);
  });

  it("reset forgets a key", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.hit("a", 0);
    limiter.reset("a");
    expect(limiter.peek("a", 1).allowed).toBe(true);
  });
});
