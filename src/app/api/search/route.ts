import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyUrl } from "@/lib/analysis/classify-url";
import type { ResultStatus } from "@/lib/analysis/labels";
import { denyIfNoAccess, jsonError, readJson } from "@/lib/api";
import { UFS } from "@/lib/geo/states";
import { MAX_RESULTS, PlacesError, searchPlaces } from "@/lib/places/google";
import { selectPlaces } from "@/lib/places/mapping";
import type { PlaceResult } from "@/lib/places/types";
import { createRateLimiter } from "@/lib/rate-limit";

export const maxDuration = 60;

// Every search spends money on Google's side. A daily cap protects the key from
// loops and accidents. Per server instance, so a brake and not a guarantee.
const DAILY_CAP = Number(process.env.MAX_SEARCHES_PER_DAY ?? 100);
const dailySearches = createRateLimiter({
  limit: Number.isFinite(DAILY_CAP) && DAILY_CAP > 0 ? DAILY_CAP : 100,
  windowMs: 24 * 60 * 60 * 1000,
});

const bodySchema = z.object({
  uf: z.enum(UFS, { error: "Escolha um estado." }),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  niche: z.string().trim().min(2, "Informe o tipo de loja.").max(60),
  onlyCity: z.boolean().default(true),
  limit: z.number().int().min(1).max(MAX_RESULTS).default(MAX_RESULTS),
});

export interface SearchResultItem extends PlaceResult {
  status: ResultStatus;
}

export interface SearchResponse {
  results: SearchResultItem[];
  /** How many places Google returned before the city filter. */
  fetched: number;
}

/** Status that can be decided from the URL alone; "CHECKING" needs a real request. */
function initialStatus(url: string | null): ResultStatus {
  switch (classifyUrl(url)) {
    case "none":
      return "NO_WEBSITE";
    case "social":
      return "SOCIAL_ONLY";
    case "invalid":
      return "UNKNOWN";
    default:
      return "CHECKING";
  }
}

export async function POST(request: NextRequest) {
  const denied = denyIfNoAccess(request);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400);
  }
  const { uf, city, niche, onlyCity, limit } = parsed.data;

  const cap = dailySearches.peek("global");
  if (!cap.allowed) {
    const hours = Math.ceil(cap.retryAfterMs / 3_600_000);
    return jsonError(
      `Limite de buscas por 24 h atingido. Libera em cerca de ${hours} h, ou aumente MAX_SEARCHES_PER_DAY.`,
      429,
    );
  }

  try {
    const places = await searchPlaces(`${niche} em ${city}, ${uf}`, limit);
    // Counted only after Google answered: failed calls (bad key, outage) cost nothing.
    dailySearches.hit("global");
    const selected = selectPlaces(places, { city, uf, onlyCity });

    const body: SearchResponse = {
      fetched: places.length,
      results: selected.map((place) => ({ ...place, status: initialStatus(place.websiteUrl) })),
    };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof PlacesError) return jsonError(error.message, error.status);
    return jsonError("Erro inesperado ao buscar. Tente de novo.", 500);
  }
}
