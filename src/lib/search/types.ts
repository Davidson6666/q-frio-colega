import type { SearchResultItem } from "@/app/api/search/route";
import type { CheckDetails } from "@/lib/analysis/website-check";

/** A result as held by the browser: the API item plus the site-check details once known. */
export type ResultItem = SearchResultItem & { check?: CheckDetails };

export type SortKey = "promising" | "rating" | "reviews" | "name";

export const SORT_LABELS: Record<SortKey, string> = {
  promising: "Mais promissoras primeiro",
  rating: "Melhor avaliadas",
  reviews: "Mais avaliações",
  name: "Nome (A a Z)",
};
