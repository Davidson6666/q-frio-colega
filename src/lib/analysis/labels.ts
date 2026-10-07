import type { BadgeTone } from "@/components/ui/badge";

/** Website health classification produced by the analysis module (Phase 3). */
export type WebsiteStatus =
  | "NO_WEBSITE"
  | "SOCIAL_ONLY"
  | "BROKEN"
  | "SLOW"
  | "NOT_MOBILE"
  | "OK"
  | "UNKNOWN";

export const WEBSITE_STATUS_META: Record<
  WebsiteStatus,
  { label: string; tone: BadgeTone }
> = {
  NO_WEBSITE: { label: "Sem site", tone: "danger" },
  BROKEN: { label: "Site fora do ar", tone: "danger" },
  SOCIAL_ONLY: { label: "Só rede social", tone: "warn" },
  NOT_MOBILE: { label: "Ruim no celular", tone: "warn" },
  SLOW: { label: "Site lento", tone: "warn" },
  OK: { label: "Site ok", tone: "neutral" },
  UNKNOWN: { label: "Verificar manualmente", tone: "neutral" },
};

export type OpportunityLevel = "low" | "medium" | "high";

export const OPPORTUNITY_LEVEL_META: Record<
  OpportunityLevel,
  { label: string; tone: BadgeTone }
> = {
  high: { label: "Oportunidade alta", tone: "accent" },
  medium: { label: "Oportunidade média", tone: "neutral" },
  low: { label: "Oportunidade baixa", tone: "neutral" },
};

/** Score thresholds from the product spec: 0-39 low, 40-69 medium, 70-100 high. */
export function levelFromScore(score: number): OpportunityLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
