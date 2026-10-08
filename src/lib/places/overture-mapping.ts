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

const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

/** Two records of one business: the most confident wins, but nothing is thrown away. */
function mergeRows(a: OvertureRow, b: OvertureRow): OvertureRow {
  const [best, other] = b.confidence > a.confidence ? [b, a] : [a, b];
  return {
    ...best,
    // A less confident duplicate may be the one that knows the website or a phone.
    phones: union(best.phones, other.phones),
    websites: union(best.websites, other.websites),
    socials: union(best.socials, other.socials),
  };
}

/** What identifies "the same place" across sources, or null when it cannot be told. */
function placeKey(row: OvertureRow): string | null {
  const name = normalizeText(row.name);
  const street = normalizeText(row.street ?? "");
  if (street) return `${name}|${street}`;
  // No street: only a shared phone number proves two records are the same place.
  // Two branches of a chain with no address must stay separate.
  const phone = row.phones[0]?.replace(/\D/g, "");
  return phone ? `${name}|tel:${phone}` : null;
}

/**
 * The same business is often present twice (e.g. from Meta and from Foursquare).
 * Duplicates are merged, keeping every phone, website and social link they carry.
 */
export function dedupeRows(rows: OvertureRow[]): OvertureRow[] {
  const merged = new Map<string, OvertureRow>();
  const unkeyed: OvertureRow[] = [];

  for (const row of rows) {
    const key = placeKey(row);
    if (key === null) {
      unkeyed.push(row);
      continue;
    }
    const current = merged.get(key);
    merged.set(key, current ? mergeRows(current, row) : row);
  }
  return [...merged.values(), ...unkeyed];
}
