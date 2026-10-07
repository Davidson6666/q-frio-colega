import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyUrl } from "@/lib/analysis/classify-url";
import { checkWebsite, type CheckResult } from "@/lib/analysis/website-check";
import { denyIfNoAccess, jsonError, readJson } from "@/lib/api";

// One attempt can take 8 s, plus a retry: leave room for a batch.
export const maxDuration = 60;

const bodySchema = z.object({
  urls: z.array(z.string().max(2048)).min(1).max(8),
});

export interface CheckResponse {
  results: Record<string, CheckResult>;
}

export async function POST(request: NextRequest) {
  const denied = denyIfNoAccess(request);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Lista de endereços inválida.", 400);

  const unique = [...new Set(parsed.data.urls)];

  const entries = await Promise.all(
    unique.map(async (url): Promise<[string, CheckResult]> => {
      // Only plain http(s) sites are fetched; anything else is refused here and
      // again inside checkWebsite, which also blocks private addresses.
      if (classifyUrl(url) !== "own") {
        return [
          url,
          {
            status: "UNKNOWN",
            details: {
              httpStatus: null,
              ttfbMs: null,
              finalUrl: null,
              hasViewport: null,
              reason: "Endereço de site inválido.",
            },
          },
        ];
      }
      return [url, await checkWebsite(url)];
    }),
  );

  const body: CheckResponse = { results: Object.fromEntries(entries) };
  return NextResponse.json(body);
}
