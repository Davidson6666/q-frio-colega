import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyUrl } from "@/lib/analysis/classify-url";
import type { ResultStatus } from "@/lib/analysis/labels";
import { denyIfNoAccess, jsonError, readJson } from "@/lib/api";
import { UFS } from "@/lib/geo/states";
import type { PlaceResult, PlacesSource } from "@/lib/places/types";
import { getProvider } from "@/lib/places/provider-config";
import { searchStores, type StoreSearchResult } from "@/lib/places/search";
import { createRateLimiter } from "@/lib/rate-limit";

// The first search of a city downloads its data (up to a minute or two).
export const maxDuration = 300;

// Google searches cost money, so they get a daily cap. It protects the key from
// loops and accidents. Per server instance: a brake, not a guarantee. Overture
// is free and has no cap.
const DAILY_CAP = Number(process.env.MAX_SEARCHES_PER_DAY ?? 100);
const dailySearches = createRateLimiter({
  limit: Number.isFinite(DAILY_CAP) && DAILY_CAP > 0 ? DAILY_CAP : 100,
  windowMs: 24 * 60 * 60 * 1000,
});

const MAX_LIMIT = 500;

const bodySchema = z.object({
  uf: z.enum(UFS, { error: "Escolha um estado." }),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  niche: z.string().trim().min(2, "Informe o tipo de loja.").max(60),
  onlyCity: z.boolean().default(true),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(MAX_LIMIT),
});

export interface SearchResultItem extends PlaceResult {
  status: ResultStatus;
}

export interface SearchResponse {
  results: SearchResultItem[];
  /** Places the source had before the store-type and city filters. Unknown for very large cities. */
  fetched?: number;
  /** Stores of the chosen type found; larger than `results` when the list was cut. */
  matched: number;
  source: PlacesSource;
  nicheMatch?: StoreSearchResult["nicheMatch"];
  release?: string;
  truncated?: boolean;
}

/** Status that can be decided without visiting the site; "CHECKING" needs a real request. */
function initialStatus(place: PlaceResult): ResultStatus {
  switch (classifyUrl(place.websiteUrl)) {
    case "own":
      return "CHECKING";
    case "institutional":
      // A public body (government domain): not visited, and never flagged as a lead.
      return "INSTITUTIONAL";
    case "invalid":
      return "UNKNOWN";
    case "social":
      return "SOCIAL_ONLY";
    case "none":
      // No site, but a social page still means they are online somewhere.
      return place.socials.length > 0 ? "SOCIAL_ONLY" : "NO_WEBSITE";
  }
}

function isHttpError(error: unknown): error is Error & { status: number } {
  return error instanceof Error && typeof (error as { status?: unknown }).status === "number";
}

export async function POST(request: NextRequest) {
  const denied = denyIfNoAccess(request);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400);
  }

  const paid = getProvider() === "google";
  if (paid) {
    const cap = dailySearches.peek("global");
    if (!cap.allowed) {
      const hours = Math.ceil(cap.retryAfterMs / 3_600_000);
      return jsonError(
        `Limite de buscas por 24 h atingido. Libera em cerca de ${hours} h, ou aumente MAX_SEARCHES_PER_DAY.`,
        429,
      );
    }
  }

  try {
    const found = await searchStores(parsed.data);
    // Counted only after the source answered: failed calls (bad key, outage) cost nothing.
    if (paid) dailySearches.hit("global");

    const body: SearchResponse = {
      source: found.source,
      fetched: found.fetched,
      matched: found.matched,
      nicheMatch: found.nicheMatch,
      release: found.release,
      truncated: found.truncated,
      results: found.places.map((place) => ({ ...place, status: initialStatus(place) })),
    };
    return NextResponse.json(body);
  } catch (error) {
    if (isHttpError(error)) return jsonError(error.message, error.status);
    return jsonError("Erro inesperado ao buscar. Tente de novo.", 500);
  }
}
