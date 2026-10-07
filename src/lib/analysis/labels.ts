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

/** What the UI shows while a site is still being checked. */
export type ResultStatus = WebsiteStatus | "CHECKING";

export const STATUS_META: Record<ResultStatus, { label: string; tone: BadgeTone }> = {
  NO_WEBSITE: { label: "Sem site", tone: "danger" },
  BROKEN: { label: "Site com problema", tone: "danger" },
  SOCIAL_ONLY: { label: "Só rede social", tone: "warn" },
  NOT_MOBILE: { label: "Ruim no celular", tone: "warn" },
  SLOW: { label: "Site lento", tone: "warn" },
  OK: { label: "Site ok", tone: "accent" },
  UNKNOWN: { label: "Verificar manualmente", tone: "neutral" },
  CHECKING: { label: "Verificando…", tone: "neutral" },
};

/** Order used by the filter chips and when sorting (most promising first). */
export const STATUS_ORDER: ResultStatus[] = [
  "NO_WEBSITE",
  "BROKEN",
  "SOCIAL_ONLY",
  "NOT_MOBILE",
  "SLOW",
  "UNKNOWN",
  "OK",
  "CHECKING",
];
