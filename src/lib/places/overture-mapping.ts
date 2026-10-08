import { classifyUrl } from "@/lib/analysis/classify-url";
import { normalizeText } from "@/lib/geo/states";
import { formatBrazilPhone, normalizeBrazilPhone } from "@/lib/phone";
import type { PlaceResult } from "./types";

/** A row as stored in the local city snapshot (see overture.ts). */
export interface OvertureRow {
  id: string;
  name: string;
  street: string | null;
  locality: string | null;
  region: string | null;
  phones: string[];
  websites: string[];
  socials: string[];
  confidence: number;
  category: string | null;
  hierarchy: string[];
}

/** Overture's own quality score. Below this the records are mostly stale or junk. */
export const MIN_CONFIDENCE = 0.5;

function httpUrls(values: string[]): string[] {
  return values.filter((value) => classifyUrl(value) !== "invalid" && /^https?:\/\//i.test(value.trim()));
}

/**
 * Picks the website to show. A real own site beats a social page, which beats
 * nothing; webmail homepages and the like count as no website at all.
 */
export function pickWebsite(websites: string[]): string | null {
  const urls = httpUrls(websites);
  return urls.find((url) => classifyUrl(url) === "own") ?? urls.find((url) => classifyUrl(url) === "social") ?? null;
}

/** First number that can receive WhatsApp (a mobile number), canonical form. */
function pickWhatsapp(phones: string[]): string | null {
  for (const phone of phones) {
    const canonical = normalizeBrazilPhone(phone);
    if (canonical && canonical.length === 13) return canonical;
  }
  return null;
}

function pickPhone(phones: string[]): string | null {
  for (const phone of phones) {
    const canonical = normalizeBrazilPhone(phone);
    if (canonical) return formatBrazilPhone(canonical);
  }
  return null;
}

function address(row: OvertureRow): string {
  const place = [row.locality, row.region].filter(Boolean).join(" - ");
  return [row.street?.trim(), place].filter(Boolean).join(", ");
}

/** A plain Google Maps search link (no API, no key) so the user can verify the place. */
function mapsSearchUrl(name: string, fullAddress: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${fullAddress}`)}`;
}

export function toPlaceResult(row: OvertureRow): PlaceResult {
  const fullAddress = address(row);
  return {
    id: row.id,
    name: row.name.trim(),
    address: fullAddress,
    phone: pickPhone(row.phones),
    whatsapp: pickWhatsapp(row.phones),
    websiteUrl: pickWebsite(row.websites),
    socials: httpUrls(row.socials),
    mapsUrl: mapsSearchUrl(row.name, fullAddress),
    rating: null,
    reviewsCount: null,
  };
}

/**
 * The same business is often present twice (e.g. from Meta and from Foursquare).
 * Rows with the same name and street are treated as one; the most confident wins.
 */
export function dedupeRows(rows: OvertureRow[]): OvertureRow[] {
  const best = new Map<string, OvertureRow>();
  for (const row of rows) {
    const key = `${normalizeText(row.name)}|${normalizeText(row.street ?? "")}`;
    const current = best.get(key);
    if (!current || row.confidence > current.confidence) best.set(key, row);
  }
  return [...best.values()];
}
