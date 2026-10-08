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
import { classifyUrl } from "@/lib/analysis/classify-url";
import { fetchHomepage } from "@/lib/analysis/website-check";
import { denyIfNoAccess, jsonError, readJson } from "@/lib/api";

// A guess is up to four quick requests per store; leave room for a batch.
export const maxDuration = 60;

// Per-item limits trim instead of reject: one store with an odd value (a name or a
// tracking-laden profile URL that is too long) must not drop the other five.
const bodySchema = z.object({
  city: z.string().trim().min(2).max(80),
  stores: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        name: z.string().transform((value) => value.trim().slice(0, 160)),
        phones: z.array(z.string()).transform((list) => list.map((p) => p.slice(0, 30)).slice(0, 4)),
        /** Social profile URLs the data already knows for this store. */
        socials: z
          .array(z.string())
          .default([])
          .transform((list) => list.filter((url) => url.length <= 300).slice(0, 6)),
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
        // A guess that ends up on a social page, a directory or a public body is not a
        // site of the store, and the card would have nothing to show for it.
        if (classifyUrl(page.finalUrl) !== "own") continue;

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
