/** One business as shown in the list. Safe to send to the browser. */
export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  /** National format as Google returns it, e.g. "(44) 3525-1234". */
  phone: string | null;
  /** Canonical mobile number ("5544999998888"), only when it can receive WhatsApp. */
  whatsapp: string | null;
  websiteUrl: string | null;
  mapsUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
}
