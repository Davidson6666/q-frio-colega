import { cacheLife } from "next/cache";
import { bboxOfGeoJson, type Bbox } from "./bbox";
import { normalizeText, type Uf } from "./states";

export interface City {
  /** 7-digit IBGE municipality code. */
  id: string;
  name: string;
}

/**
 * Municipalities of a state, from IBGE's public API (no key). The list barely
 * changes, so it is cached for days and shared across requests.
 */
export async function listCities(uf: Uf): Promise<City[]> {
  "use cache";
  cacheLife("days");

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error(`IBGE responded ${response.status}`);

  const data = (await response.json()) as Array<{ id: number; nome: string }>;
  return data.map((city) => ({ id: String(city.id), name: city.nome }));
}

export async function getCities(uf: Uf): Promise<string[]> {
  return (await listCities(uf)).map((city) => city.name);
}

/** Finds a city by name inside a state, ignoring case and accents. */
export async function resolveCity(uf: Uf, input: string): Promise<City | null> {
  const wanted = normalizeText(input);
  return (await listCities(uf)).find((city) => normalizeText(city.name) === wanted) ?? null;
}

/**
 * Bounding box of a municipality from IBGE's boundary mesh, padded a little so a
 * simplified outline never clips a store near the edge.
 */
export async function getCityBbox(ibgeId: string): Promise<Bbox> {
  "use cache";
  cacheLife("days");

  if (!/^\d{7}$/.test(ibgeId)) throw new Error("Invalid IBGE code");

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${ibgeId}?formato=application/vnd.geo+json&qualidade=minima`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!response.ok) throw new Error(`IBGE responded ${response.status}`);

  const bbox = bboxOfGeoJson(await response.json(), 0.02);
  if (!bbox) throw new Error("IBGE returned no boundary for this city");
  return bbox;
}
