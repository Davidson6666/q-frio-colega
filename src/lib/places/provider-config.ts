import type { PlacesSource } from "./types";

/**
 * Which data source to use. Explicit PLACES_PROVIDER wins; otherwise Google is
 * used only when a key exists, so a fresh checkout works without any account.
 */
export function getProvider(): PlacesSource {
  const explicit = process.env.PLACES_PROVIDER;
  if (explicit === "google" || explicit === "overture") return explicit;
  return process.env.GOOGLE_PLACES_API_KEY ? "google" : "overture";
}
