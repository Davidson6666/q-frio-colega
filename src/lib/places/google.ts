import "server-only";
import type { GooglePlace } from "./mapping";

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Phone, website and rating belong to Google's higher-priced "Enterprise" field
// group; asking only for what the list needs keeps each search as cheap as possible.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "nextPageToken", // must be requested explicitly or pagination silently stops
].join(",");

const PAGE_SIZE = 20; // API maximum per page
export const MAX_RESULTS = 60; // API maximum per query (3 pages)

export class PlacesError extends Error {
  constructor(
    message: string,
    /** HTTP status to report to our own client. */
    public status: number,
  ) {
    super(message);
  }
}

function explain(status: number, googleStatus: string | undefined, raw: string): PlacesError {
  if (status === 400 && /API key not valid/i.test(raw)) {
    return new PlacesError("A chave do Google Places é inválida. Confira GOOGLE_PLACES_API_KEY.", 502);
  }
  if (status === 403) {
    return new PlacesError(
      "O Google recusou a chave. Verifique se a Places API (New) está ativada e se a cobrança está habilitada no projeto.",
      502,
    );
  }
  if (status === 429) {
    return new PlacesError("Limite de uso do Google atingido. Tente de novo mais tarde.", 429);
  }
  return new PlacesError(`O Google retornou um erro (${googleStatus ?? status}).`, 502);
}

/** Runs a text search and follows pagination until `maxResults` or the API limit. */
export async function searchPlaces(query: string, maxResults: number): Promise<GooglePlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new PlacesError("GOOGLE_PLACES_API_KEY não está configurada no servidor.", 500);
  }

  const wanted = Math.min(Math.max(1, maxResults), MAX_RESULTS);
  const places: GooglePlace[] = [];
  let pageToken: string | undefined;

  while (places.length < wanted) {
    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
          "x-goog-fieldmask": FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "pt-BR",
          regionCode: "BR",
          // Never ask (and pay) for more than is still needed.
          pageSize: Math.min(PAGE_SIZE, wanted - places.length),
          ...(pageToken ? { pageToken } : {}),
        }),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
    } catch {
      throw new PlacesError("Não foi possível falar com o Google. Tente de novo.", 502);
    }

    if (!response.ok) {
      const raw = await response.text();
      let googleStatus: string | undefined;
      try {
        googleStatus = (JSON.parse(raw) as { error?: { status?: string } }).error?.status;
      } catch {
        // Not JSON; the generic message below is enough.
      }
      throw explain(response.status, googleStatus, raw);
    }

    const data = (await response.json()) as { places?: GooglePlace[]; nextPageToken?: string };
    places.push(...(data.places ?? []).slice(0, wanted - places.length));

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return places;
}
