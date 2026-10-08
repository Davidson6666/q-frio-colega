import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";
import type { Bbox } from "@/lib/geo/bbox";
import { normalizeText } from "@/lib/geo/states";
import { MIN_CONFIDENCE, type OvertureRow } from "./overture-mapping";

/**
 * Overture Maps places, read straight from the public S3 bucket with DuckDB
 * (no key, no account). A whole city is downloaded once and kept on disk, so
 * choosing another store type in the same city afterwards is instant.
 */

// Used only when the release index cannot be reached. Old releases are removed
// from the bucket after a while, so this must be refreshed from time to time.
const FALLBACK_RELEASE = "2026-09-23.1";
const RELEASE_PATTERN = /^\d{4}-\d{2}-\d{2}\.\d+$/;
const RELEASE_INDEX = "https://stac.overturemaps.org/catalog.json";
const ROW_CAP = 50_000;
const QUERY_TIMEOUT_MS = 5 * 60 * 1000;

export class OvertureError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

/** Narrows a query to one store type. Used for cities too big to keep whole. */
export type RowFilter =
  | { kind: "category"; categories: string[] }
  | { kind: "name"; text: string };

export interface CitySnapshot {
  release: string;
  rows: OvertureRow[];
  /** True when a very large city hit the row cap and the list is partial. */
  truncated: boolean;
}

// --- release -----------------------------------------------------------------

let cachedRelease: { value: string; expiresAt: number } | null = null;

export async function getRelease(): Promise<string> {
  const pinned = process.env.OVERTURE_RELEASE;
  if (pinned && RELEASE_PATTERN.test(pinned)) return pinned;
  if (cachedRelease && Date.now() < cachedRelease.expiresAt) return cachedRelease.value;

  try {
    const response = await fetch(RELEASE_INDEX, { signal: AbortSignal.timeout(5_000), cache: "no-store" });
    const data = (await response.json()) as { latest?: string };
    if (response.ok && data.latest && RELEASE_PATTERN.test(data.latest)) {
      cachedRelease = { value: data.latest, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
      return data.latest;
    }
  } catch {
    // Index unreachable: fall through to the last known release.
  }

  // Remember the fallback briefly. Without this every search would wait for the
  // index timeout again, and a release that flips between searches would make the
  // disk cache miss and re-download whole cities.
  const value = cachedRelease?.value ?? FALLBACK_RELEASE;
  cachedRelease = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
  return value;
}

// --- DuckDB ------------------------------------------------------------------

let instancePromise: Promise<DuckDBInstance> | null = null;

function getInstance(): Promise<DuckDBInstance> {
  instancePromise ??= (async () => {
    const instance = await DuckDBInstance.create(":memory:");
    const connection = await instance.connect();
    try {
      // httpfs lets DuckDB read parquet over HTTPS/S3 with range requests.
      await connection.run("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';");
    } finally {
      connection.closeSync();
    }
    return instance;
  })().catch((error) => {
    instancePromise = null; // allow a retry on the next search
    throw error;
  });
  return instancePromise;
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/** SQL for a row filter. Category ids come from our own static list; the name text is a bound parameter. */
function filterClause(filter: RowFilter | undefined): { sql: string; values: string[] } {
  if (!filter) return { sql: "", values: [] };
  if (filter.kind === "category") {
    const ids = filter.categories.filter((id) => /^[a-z0-9_]+$/.test(id));
    if (ids.length === 0) return { sql: " AND false", values: [] };
    const list = ids.map((id) => `'${id}'`).join(", ");
    return { sql: ` AND list_has_any(taxonomy.hierarchy, [${list}])`, values: [] };
  }
  // Escape LIKE wildcards in the user's text so "%" and "_" match literally.
  const escaped = filter.text.replace(/[\\%_]/g, (char) => `\\${char}`);
  return { sql: " AND strip_accents(lower(names.primary)) LIKE ? ESCAPE '\\'", values: [`%${escaped}%`] };
}

async function queryCity(
  release: string,
  bbox: Bbox,
  cityName: string,
  uf: string,
  filter?: RowFilter,
): Promise<CitySnapshot> {
  // The release is interpolated into a path, so it must match a strict pattern.
  if (!RELEASE_PATTERN.test(release)) throw new OvertureError("Versão de dados inválida.", 500);

  const extra = filterClause(filter);
  const sql = `
    SELECT id,
           names.primary AS name,
           addresses[1].freeform AS street,
           addresses[1].locality AS locality,
           addresses[1].region AS region,
           phones, websites, socials, confidence,
           taxonomy.primary AS category,
           taxonomy.hierarchy AS hierarchy
    FROM read_parquet('s3://overturemaps-us-west-2/release/${release}/theme=places/type=place/*', hive_partitioning=1)
    WHERE bbox.xmin > ? AND bbox.xmax < ? AND bbox.ymin > ? AND bbox.ymax < ?
      AND strip_accents(lower(addresses[1].locality)) = ?
      AND (addresses[1].region = ? OR addresses[1].region IS NULL)
      AND confidence >= ?
      AND names.primary IS NOT NULL${extra.sql}
    ORDER BY confidence DESC
    LIMIT ${ROW_CAP + 1}`;

  let connection: DuckDBConnection | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let records: Array<Record<string, unknown>>;
  try {
    // Startup is inside the try as well: a missing network, a read-only home
    // directory for the httpfs extension or a native-module failure must all
    // surface as the friendly message below, not as an unexpected error.
    const instance = await getInstance();
    const active = await instance.connect();
    connection = active;

    const run = active
      .runAndReadAll(sql, [bbox.xmin, bbox.xmax, bbox.ymin, bbox.ymax, normalizeText(cityName), uf, MIN_CONFIDENCE, ...extra.values])
      .then((result) => result.getRowObjectsJson() as Array<Record<string, unknown>>);

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        // Stop the query itself, or it keeps using CPU and bandwidth and a retry piles up on top.
        active.interrupt();
        reject(new OvertureError("A consulta aos dados demorou demais. Tente de novo.", 504));
      }, QUERY_TIMEOUT_MS);
    });

    records = await Promise.race([run, timeout]);
  } catch (error) {
    if (error instanceof OvertureError) throw error;
    throw new OvertureError(
      "Não foi possível baixar os dados do Overture Maps. Confira a conexão com a internet e tente de novo.",
    );
  } finally {
    clearTimeout(timer);
    connection?.closeSync(); // a connection per search would otherwise leak native memory
  }

  const truncated = records.length > ROW_CAP;
  const rows: OvertureRow[] = records.slice(0, ROW_CAP).map((record) => ({
    id: String(record.id),
    name: String(record.name),
    street: typeof record.street === "string" ? record.street : null,
    locality: typeof record.locality === "string" ? record.locality : null,
    region: typeof record.region === "string" ? record.region : null,
    phones: strings(record.phones),
    websites: strings(record.websites),
    socials: strings(record.socials),
    confidence: Number(record.confidence),
    category: typeof record.category === "string" ? record.category : null,
    hierarchy: strings(record.hierarchy),
  }));

  return { release, rows, truncated };
}

// --- disk cache --------------------------------------------------------------

const cacheFile = (release: string, key: string) =>
  path.join(process.cwd(), ".cache", "overture", release, `${key}.json`);

function filterKey(filter: RowFilter): string {
  if (filter.kind === "category") return `c-${[...filter.categories].sort().join("+")}`;
  return `n-${createHash("sha1").update(filter.text).digest("hex").slice(0, 12)}`;
}

async function readCache(release: string, key: string): Promise<CitySnapshot | null> {
  try {
    const snapshot = JSON.parse(await readFile(cacheFile(release, key), "utf8")) as CitySnapshot;
    return snapshot.release === release && Array.isArray(snapshot.rows) ? snapshot : null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, snapshot: CitySnapshot): Promise<void> {
  try {
    const file = cacheFile(snapshot.release, key);
    await mkdir(path.dirname(file), { recursive: true });
    // Write then rename, so a crash never leaves a half-written file behind.
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(snapshot));
    await rename(temporary, file);
  } catch {
    // Read-only or missing disk (some hosts): the search still works, just uncached.
  }
}

// --- public API --------------------------------------------------------------

const inFlight = new Map<string, Promise<CitySnapshot>>();

/**
 * Places Overture knows in a city, from disk if downloaded before.
 * Without a filter: the whole city (capped; check `truncated`).
 * With a filter: only that store type, which stays complete for very large cities.
 */
export async function loadCity(params: {
  ibgeId: string;
  cityName: string;
  uf: string;
  bbox: Bbox;
  filter?: RowFilter;
}): Promise<CitySnapshot> {
  const release = await getRelease();
  const key = params.filter ? `${params.ibgeId}.${filterKey(params.filter)}` : params.ibgeId;

  const cached = await readCache(release, key);
  if (cached) return cached;

  const flightKey = `${release}:${key}`;
  let pending = inFlight.get(flightKey);
  if (!pending) {
    pending = queryCity(release, params.bbox, params.cityName, params.uf, params.filter)
      .then(async (snapshot) => {
        // A city too big to keep whole only needs to remember that fact: its rows
        // are never used (the search asks for the store type instead), and storing
        // tens of thousands of them would make every later search parse a huge file.
        const stored = snapshot.truncated && !params.filter ? { ...snapshot, rows: [] } : snapshot;
        await writeCache(key, stored);
        return stored;
      })
      .finally(() => inFlight.delete(flightKey));
    inFlight.set(flightKey, pending);
  }
  return pending;
}
