import "server-only";
import { getCityBbox, resolveCity } from "@/lib/geo/cities";
import type { Uf } from "@/lib/geo/states";
import { searchPlaces } from "./google";
import { selectPlaces } from "./mapping";
import { matchesNiche, resolveNiche } from "./niches";
import { loadCity } from "./overture";
import { dedupeRows, toPlaceResult } from "./overture-mapping";
import { getProvider } from "./provider-config";
import type { PlaceResult, PlacesSource } from "./types";

export class SearchError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface StoreSearchInput {
  uf: Uf;
  city: string;
  niche: string;
  /** Google only: drop neighbouring towns. Overture is always city-exact. */
  onlyCity: boolean;
  limit: number;
}

export interface StoreSearchResult {
  source: PlacesSource;
  places: PlaceResult[];
  /** Places the source had before the store-type and city filters. Unknown for very large cities. */
  fetched?: number;
  /** Stores of the chosen type found, before cutting the list at the requested limit. */
  matched: number;
  /** How the typed store type was understood (Overture only). */
  nicheMatch?: { kind: "category" | "name"; label: string };
  /** Overture data release, shown so the user knows how fresh the data is. */
  release?: string;
  /** Very large city: the list is partial. */
  truncated?: boolean;
}

async function searchGoogle(input: StoreSearchInput): Promise<StoreSearchResult> {
  const raw = await searchPlaces(`${input.niche} em ${input.city}, ${input.uf}`, input.limit);
  const places = selectPlaces(raw, { city: input.city, uf: input.uf, onlyCity: input.onlyCity });
  return { source: "google", places, fetched: raw.length, matched: places.length };
}

async function searchOverture(input: StoreSearchInput): Promise<StoreSearchResult> {
  let city;
  let bbox;
  try {
    city = await resolveCity(input.uf, input.city);
    if (city) bbox = await getCityBbox(city.id);
  } catch {
    throw new SearchError("Não consegui consultar o IBGE agora. Tente de novo em instantes.", 502);
  }
  if (!city || !bbox) {
    throw new SearchError(
      `Não encontrei "${input.city}" em ${input.uf}. Escolha uma cidade da lista.`,
      400,
    );
  }

  const query = resolveNiche(input.niche);
  const base = { ibgeId: city.id, cityName: city.name, uf: input.uf, bbox };

  let snapshot = await loadCity(base);
  let fetched: number | undefined = snapshot.rows.length;
  if (snapshot.truncated) {
    // Too big to hold whole: dropping rows by confidence would silently lose stores of
    // the type we want. Ask for this store type only, which stays complete.
    snapshot = await loadCity({
      ...base,
      filter:
        query.kind === "category"
          ? { kind: "category", categories: query.niche.categories }
          : { kind: "name", text: query.text },
    });
    fetched = undefined;
  }

  const matching = dedupeRows(snapshot.rows.filter((row) => matchesNiche(query, row)))
    // Most reliable records first, so the cut at `limit` drops the weakest.
    .sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name, "pt-BR"));
  const shown = matching.slice(0, input.limit);

  return {
    source: "overture",
    places: shown.map(toPlaceResult),
    fetched,
    matched: matching.length,
    nicheMatch:
      query.kind === "category"
        ? { kind: "category", label: query.niche.label }
        : { kind: "name", label: input.niche },
    release: snapshot.release,
    truncated: snapshot.truncated,
  };
}

export async function searchStores(input: StoreSearchInput): Promise<StoreSearchResult> {
  return getProvider() === "google" ? searchGoogle(input) : searchOverture(input);
}
