import { STATUS_ORDER } from "@/lib/analysis/labels";
import type { ResultItem, SortKey } from "./types";

const byName = (a: ResultItem, b: ResultItem) => a.name.localeCompare(b.name, "pt-BR");
const num = (value: number | null) => value ?? -1;

/** Returns a new sorted array. "Promising" = clearest need first, then more reviews. */
export function sortResults(results: ResultItem[], key: SortKey): ResultItem[] {
  const sorted = [...results];

  switch (key) {
    case "promising":
      return sorted.sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
          num(b.reviewsCount) - num(a.reviewsCount) ||
          byName(a, b),
      );
    case "rating":
      return sorted.sort((a, b) => num(b.rating) - num(a.rating) || num(b.reviewsCount) - num(a.reviewsCount) || byName(a, b));
    case "reviews":
      return sorted.sort((a, b) => num(b.reviewsCount) - num(a.reviewsCount) || byName(a, b));
    case "name":
      return sorted.sort(byName);
  }
}
