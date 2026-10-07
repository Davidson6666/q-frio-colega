/** Servicos que o usuario pode vender. Usado no onboarding, perfil e busca. */
export const SERVICES = [
  { id: "site", label: "Criação de sites" },
  { id: "social-media", label: "Social media" },
  { id: "design", label: "Design" },
  { id: "trafego-pago", label: "Tráfego pago" },
  { id: "automacao", label: "Automação" },
  { id: "video", label: "Edição de vídeo" },
  { id: "foto", label: "Fotografia" },
  { id: "consultoria", label: "Consultoria" },
  { id: "marketing", label: "Marketing" },
  { id: "outro", label: "Outro" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export const SERVICE_IDS = SERVICES.map((s) => s.id) as [ServiceId, ...ServiceId[]];

export function serviceLabel(id: string): string {
  return SERVICES.find((s) => s.id === id)?.label ?? id;
}
