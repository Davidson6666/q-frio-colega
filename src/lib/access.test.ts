import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_MAX_AGE_SECONDS,
  accessState,
  hasAccess,
  passwordMatches,
  sessionToken,
} from "./access";

const SECRET = "x".repeat(40);
const NOW = 1_800_000_000_000;

describe("access gate", () => {
  beforeEach(() => {
    vi.stubEnv("APP_PASSWORD", "segredo-forte");
    vi.stubEnv("SESSION_SECRET", SECRET);
    vi.stubEnv("NODE_ENV", "production");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("denies a missing, malformed or forged cookie", () => {
    expect(accessState(undefined, NOW)).toBe("denied");
    expect(accessState("", NOW)).toBe("denied");
    expect(accessState("abc", NOW)).toBe("denied");
    expect(accessState(`${NOW}.${"0".repeat(64)}`, NOW)).toBe("denied");
    expect(accessState(`${NOW}.zz`, NOW)).toBe("denied");
    expect(accessState(`${NOW}.aa.bb`, NOW)).toBe("denied");
    expect(accessState(`-1.${"0".repeat(64)}`, NOW)).toBe("denied");
  });

  it("grants the cookie issued by a login", () => {
    const token = sessionToken(NOW);
    expect(accessState(token, NOW + 1000)).toBe("granted");
    expect(hasAccess(accessState(token, NOW + 1000))).toBe(true);
  });

  it("issues a different cookie at each login", () => {
    expect(sessionToken(NOW)).not.toBe(sessionToken(NOW + 1));
  });

  it("rejects a cookie whose timestamp was altered", () => {
    const [, signature] = sessionToken(NOW).split(".");
    expect(accessState(`${NOW + 5}.${signature}`, NOW + 1000)).toBe("denied");
  });

  it("expires sessions", () => {
    const token = sessionToken(NOW);
    const justInside = NOW + SESSION_MAX_AGE_SECONDS * 1000;
    expect(accessState(token, justInside)).toBe("granted");
    expect(accessState(token, justInside + 1)).toBe("denied");
  });

  it("rejects a cookie dated in the future", () => {
    expect(accessState(sessionToken(NOW + 3_600_000), NOW)).toBe("denied");
  });

  it("invalidates old sessions when the password changes", () => {
    const old = sessionToken(NOW);
    vi.stubEnv("APP_PASSWORD", "outra-senha");
    expect(accessState(old, NOW)).toBe("denied");
  });

  it("invalidates old sessions when the secret changes", () => {
    const old = sessionToken(NOW);
    vi.stubEnv("SESSION_SECRET", "y".repeat(40));
    expect(accessState(old, NOW)).toBe("denied");
  });

  it("does not let the cookie reveal anything usable about the password", () => {
    // The signing key is the secret, not the password: the same password under a
    // different secret yields a different signature, so a stolen cookie gives an
    // attacker nothing to test password guesses against.
    const a = sessionToken(NOW);
    vi.stubEnv("SESSION_SECRET", "z".repeat(40));
    const b = sessionToken(NOW);
    expect(a.split(".")[1]).not.toBe(b.split(".")[1]);
  });

  it("compares passwords exactly", () => {
    expect(passwordMatches("segredo-forte")).toBe(true);
    expect(passwordMatches("segredo-fort")).toBe(false);
    expect(passwordMatches("Segredo-forte")).toBe(false);
    expect(passwordMatches("")).toBe(false);
  });

  it("refuses everything in production without a password", () => {
    vi.stubEnv("APP_PASSWORD", "");
    expect(accessState(undefined, NOW)).toBe("misconfigured");
    expect(hasAccess(accessState(undefined, NOW))).toBe(false);
    expect(passwordMatches("")).toBe(false);
  });

  it("refuses everything in production without a strong SESSION_SECRET", () => {
    vi.stubEnv("SESSION_SECRET", "");
    expect(accessState(undefined, NOW)).toBe("misconfigured");
    vi.stubEnv("SESSION_SECRET", "curto");
    expect(accessState(undefined, NOW)).toBe("misconfigured");
  });

  it("is open in development without a password", () => {
    vi.stubEnv("APP_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(accessState(undefined, NOW)).toBe("open");
    expect(hasAccess("open")).toBe(true);
  });

  it("works in development with a password and no secret", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SESSION_SECRET", "");
    expect(accessState(sessionToken(NOW), NOW)).toBe("granted");
  });
});
