import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  describeEvidence,
  evaluateEvidence,
  evidenceStrength,
  guessCandidates,
  type Strength,
} from "@/lib/analysis/domain-guess";
import { fetchHomepage } from "@/lib/analysis/website-check";
import { denyIfNoAccess, jsonError, readJson } from "@/lib/api";

// A guess is up to four quick requests per store; leave room for a batch.
export const maxDuration = 60;

const bodySchema = z.object({
  city: z.string().trim().min(2).max(80),
  stores: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        name: z.string().trim().min(2).max(160),
        phones: z.array(z.string().max(30)).max(4),
        /** Social profile URLs the data already knows for this store. */
        socials: z.array(z.string().max(300)).max(6).default([]),
      }),
    )
    .min(1)
    .max(6),
});

export interface PossibleSite {
  url: string;
  /** What on the page ties it to the store: "nome no título", "cidade", "mesma rede social"... */
  evidence: string[];
  /** "weak" means only the page title carries the name: worth a look, not worth trusting. */
  strength: Strength;
}

export interface GuessResponse {
  results: Record<string, PossibleSite | null>;
}

export async function POST(request: NextRequest) {
  const denied = denyIfNoAccess(request);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Lista de lojas inválida.", 400);
  const { city, stores } = parsed.data;

  const entries = await Promise.all(
    stores.map(async (store): Promise<[string, PossibleSite | null]> => {
      // Hosts are built here, from the store name only: callers cannot choose where we connect.
      let weak: PossibleSite | null = null;

      for (const host of guessCandidates(store.name, city)) {
        const page = await fetchHomepage(`https://${host}`, { maxBytes: 512 * 1024 });
        if (!page.ok || page.status >= 400) continue;

        const evidence = evaluateEvidence({
          html: page.html,
          name: store.name,
          city,
          phones: store.phones,
          socials: store.socials,
        });
        const strength = evidenceStrength(evidence, host);
        if (!strength) continue;

        const found: PossibleSite = { url: page.finalUrl, evidence: describeEvidence(evidence), strength };
        if (strength === "strong") return [store.id, found];
        weak ??= found; // keep looking: another candidate may be strong
      }
      return [store.id, weak];
    }),
  );

  const body: GuessResponse = { results: Object.fromEntries(entries) };
  return NextResponse.json(body);
}
