/**
 * Identidade do produto. O nome e provisorio: troque aqui e o resto do app acompanha.
 */
export const siteConfig = {
  name: "Garimpo",
  tagline: "Encontre quem precisa do que você vende",
  description:
    "Plataforma de prospecção para freelancers: encontre empresas locais, descubra a oportunidade em cada uma e aborde com mensagem pronta.",
  locale: "pt-BR",
  // Atualize quando o dominio definitivo existir.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "contato@garimpo.app",
} as const;

/**
 * Base URL used in links that leave the app (auth redirects, e-mail links).
 * In production it must be configured explicitly: silently falling back to
 * localhost would put broken links in confirmation e-mails.
 */
export function getAuthBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  }
  return "http://localhost:3000";
}
