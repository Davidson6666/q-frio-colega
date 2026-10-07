import { cacheLife } from "next/cache";
import type { Uf } from "./states";

/**
 * Municipalities of a state, from IBGE's public API (no key). The list barely
 * changes, so it is cached for days and shared across requests.
 */
export async function getCities(uf: Uf): Promise<string[]> {
  "use cache";
  cacheLife("days");

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error(`IBGE responded ${response.status}`);

  const data = (await response.json()) as Array<{ nome: string }>;
  return data.map((city) => city.nome);
}
