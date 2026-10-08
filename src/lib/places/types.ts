/** One business as shown in the list. Safe to send to the browser. */
export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  /** National format, e.g. "(44) 3525-1234". */
  phone: string | null;
  /** Canonical mobile number ("5544999998888"), only when it can receive WhatsApp. */
  whatsapp: string | null;
  websiteUrl: string | null;
  /** Instagram, Facebook and similar pages known for this business. */
  socials: string[];
  mapsUrl: string | null;
  /** Not every data source has ratings; null means "unknown", never "zero". */
  rating: number | null;
  reviewsCount: number | null;
}

/** Where the list came from. Changes what the UI can promise. */
export type PlacesSource = "google" | "overture";
