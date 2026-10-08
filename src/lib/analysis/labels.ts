import type { BadgeTone } from "@/components/ui/badge";

/** Website health classification. */
export type WebsiteStatus =
  | "NO_WEBSITE"
  | "SOCIAL_ONLY"
  | "BROKEN"
  | "SLOW"
  | "NOT_MOBILE"
  | "OK"
  | "UNKNOWN";

/**
 * What the UI shows for a store.
 * - CHECKING: its site is still being visited.
 * - POSSIBLE_SITE: no site in the data, but a domain built from the store name
 *   answers with matching evidence. A hint to verify, never a verdict.
 * - INSTITUTIONAL: a public body or national brand, not a prospect for a site.
 */
export type ResultStatus = WebsiteStatus | "CHECKING" | "POSSIBLE_SITE" | "INSTITUTIONAL";

export const STATUS_META: Record<ResultStatus, { label: string; tone: BadgeTone }> = {
  NO_WEBSITE: { label: "Sem site", tone: "danger" },
  BROKEN: { label: "Site com problema", tone: "danger" },
  SOCIAL_ONLY: { label: "Só rede social", tone: "warn" },
  NOT_MOBILE: { label: "Ruim no celular", tone: "warn" },
  SLOW: { label: "Site lento", tone: "warn" },
  OK: { label: "Site ok", tone: "accent" },
  UNKNOWN: { label: "Verificar manualmente", tone: "neutral" },
  POSSIBLE_SITE: { label: "Possível site", tone: "warn" },
  INSTITUTIONAL: { label: "Site institucional", tone: "neutral" },
  CHECKING: { label: "Verificando…", tone: "neutral" },
};

/** Order used by the filter chips and when sorting (most promising first). */
export const STATUS_ORDER: ResultStatus[] = [
  "NO_WEBSITE",
  "BROKEN",
  "SOCIAL_ONLY",
  "NOT_MOBILE",
  "SLOW",
  "POSSIBLE_SITE",
  "UNKNOWN",
  "OK",
  "INSTITUTIONAL",
  "CHECKING",
];
