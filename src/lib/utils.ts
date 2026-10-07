import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tab, CR, LF and other C0 controls, plus DEL.
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/**
 * Accepts only same-origin relative paths. Anything else (absolute URLs,
 * protocol-relative `//host`, backslash tricks, control characters) falls back
 * to `fallback`. Used for the `next` redirect parameter to prevent open redirects.
 */
export function safeNextPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  // URL parsers silently strip tab, CR and LF, so "/<TAB>/evil.com" would
  // be parsed as "//evil.com", a protocol-relative URL.
  if (CONTROL_CHARS.test(value)) return fallback;

  // Final check: resolving against a fake origin must stay on that origin.
  try {
    const base = "http://internal.invalid";
    if (new URL(value, base).origin !== base) return fallback;
  } catch {
    return fallback;
  }
  return value;
}
