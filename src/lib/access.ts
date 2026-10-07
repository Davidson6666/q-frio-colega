import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Single-password access gate for a personal tool.
 *
 * - APP_PASSWORD set: login required.
 * - APP_PASSWORD unset in development: open, for convenience.
 * - Production without APP_PASSWORD or without SESSION_SECRET: everything is
 *   refused. Misconfiguration must never leave a paid API key exposed.
 *
 * Session cookie: "<issuedAt>.<signature>", signed with SESSION_SECRET, a random
 * secret that is independent of the password. That matters: if the signing key
 * were the password itself, anyone holding a copy of the cookie could test
 * password guesses offline. The signature also covers a fingerprint of the
 * current password, so changing the password (or the secret) logs everyone out.
 */

export const SESSION_COOKIE = "garimpo_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AccessState = "open" | "granted" | "denied" | "misconfigured";

const DEV_SECRET = "garimpo-development-secret-do-not-use-in-production";
const CLOCK_SKEW_MS = 60_000;

function password(): string | undefined {
  const value = process.env.APP_PASSWORD;
  return value && value.length > 0 ? value : undefined;
}

function secret(): string | undefined {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  return process.env.NODE_ENV === "production" ? undefined : DEV_SECRET;
}

function hmac(key: string, message: string): Buffer {
  return createHmac("sha256", key).update(message).digest();
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(sessionSecret: string, currentPassword: string, issuedAt: number): Buffer {
  const fingerprint = hmac(sessionSecret, `password:${currentPassword}`).toString("hex");
  return hmac(sessionSecret, `v2.${issuedAt}.${fingerprint}`);
}

/** Value for the session cookie after a successful login. */
export function sessionToken(now = Date.now()): string {
  const currentPassword = password();
  const sessionSecret = secret();
  if (!currentPassword || !sessionSecret) {
    throw new Error("APP_PASSWORD and SESSION_SECRET must be configured");
  }
  return `${now}.${signature(sessionSecret, currentPassword, now).toString("hex")}`;
}

export function accessState(cookieValue: string | undefined, now = Date.now()): AccessState {
  const currentPassword = password();
  if (!currentPassword) return process.env.NODE_ENV === "production" ? "misconfigured" : "open";

  const sessionSecret = secret();
  if (!sessionSecret) return "misconfigured";

  if (!cookieValue) return "denied";
  const [issuedRaw, presentedHex, ...extra] = cookieValue.split(".");
  if (extra.length > 0 || !issuedRaw || !presentedHex || !/^\d{1,15}$/.test(issuedRaw)) {
    return "denied";
  }

  const issuedAt = Number(issuedRaw);
  const age = now - issuedAt;
  if (age < -CLOCK_SKEW_MS || age > SESSION_MAX_AGE_SECONDS * 1000) return "denied";

  const presented = Buffer.from(presentedHex, "hex");
  const expected = signature(sessionSecret, currentPassword, issuedAt);
  return safeEqual(presented, expected) ? "granted" : "denied";
}

/** Constant-time password comparison (hashes both sides so length does not leak). */
export function passwordMatches(input: string): boolean {
  const currentPassword = password();
  if (!currentPassword) return false;
  return safeEqual(hmac("compare", input), hmac("compare", currentPassword));
}

export function hasAccess(state: AccessState): boolean {
  return state === "open" || state === "granted";
}
