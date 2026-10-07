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
