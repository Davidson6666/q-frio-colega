import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Accepts only same-origin relative paths. Anything else (absolute URLs,
 * protocol-relative `//host`, backslash tricks) falls back to `fallback`.
 * Used for the `next` redirect parameter to prevent open redirects.
 */
export function safeNextPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
