import { normalizeText } from "@/lib/geo/states";
import { normalizeBrazilPhone } from "@/lib/phone";
import type { PlaceResult } from "./types";

/** The subset of the Places API (New) response we ask for. */
export interface GooglePlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
}

/** Mobile numbers (13 digits with country code) can receive WhatsApp; landlines cannot. */
function mobileWhatsapp(phone: string | undefined): string | null {
  if (!phone) return null;
  const canonical = normalizeBrazilPhone(phone);
  return canonical && canonical.length === 13 ? canonical : null;
}

export function toPlaceResult(place: GooglePlace): PlaceResult {
  return {
    id: place.id,
    name: place.displayName?.text?.trim() || "Sem nome",
    address: place.formattedAddress ?? "",
    phone: place.nationalPhoneNumber ?? null,
    whatsapp: mobileWhatsapp(place.nationalPhoneNumber),
    websiteUrl: place.websiteUri?.trim() || null,
    socials: [],
    mapsUrl: place.googleMapsUri ?? null,
    rating: place.rating ?? null,
    reviewsCount: place.userRatingCount ?? null,
  };
}

/**
 * Extracts the city from a normalized Google address by reading the segment that
 * sits right before the state: "..., Campo Mourao - pr, 87300-000, brasil".
 * Returns null when the address does not follow a known layout.
 */
function cityFromAddress(normalizedAddress: string, uf: string): string | null {
  const state = uf.toLowerCase();
  const dashed = new RegExp(String.raw`(?:^|,)\s*([^,]+?)\s*-\s*${state}\s*(?:,|$)`).exec(normalizedAddress);
  if (dashed) return dashed[1].trim();
  const comma = new RegExp(String.raw`,\s*([^,]+?)\s*,\s*${state}\s*(?:,|$)`).exec(normalizedAddress);
  return comma ? comma[1].trim() : null;
}

/**
 * Keeps operating businesses, removes duplicates and, optionally, anything
 * whose address is not in the requested city and state. A text search for
 * "barbearia em Campo Mourão" can also return neighboring towns.
 */
export function selectPlaces(
  places: GooglePlace[],
  options: { city: string; uf: string; onlyCity: boolean },
): PlaceResult[] {
  const city = normalizeText(options.city);
  // Google formats addresses as "..., Cidade - PR, 00000-000, Brasil": the state
  // follows a dash or comma, so a street called "Pr" cannot be mistaken for it.
  const ufPattern = new RegExp("[-,]\\s*" + options.uf.toLowerCase() + "\\s*(,|$)");
  const seen = new Set<string>();
  const out: PlaceResult[] = [];

  for (const place of places) {
    if (!place.id || seen.has(place.id)) continue;
    // Missing status is treated as operating; closed ones are noise for prospecting.
    if (place.businessStatus && place.businessStatus !== "OPERATIONAL") continue;

    if (options.onlyCity) {
      const address = normalizeText(place.formattedAddress ?? "");
      // Compare the city segment itself: "Rua dos Santos" must not pass for the
      // city of Santos. Only when the layout is unknown do we fall back to a
      // looser "address mentions the city and the state" test.
      const found = cityFromAddress(address, options.uf);
      const inCity = found !== null ? found === city : address.includes(city) && ufPattern.test(address);
      if (!inCity) continue;
    }

    seen.add(place.id);
    out.push(toPlaceResult(place));
  }

  return out;
}
