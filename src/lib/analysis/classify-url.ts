/**
 * Decides, from the URL alone, whether a business "has a website".
 * A link to Instagram, Facebook, a link-in-bio page or a marketplace is not a
 * website of its own.
 */

const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "fb.me",
  "linktr.ee",
  "linktree.com",
  "wa.me",
  "whatsapp.com",
  "linkin.bio",
  "bio.site",
  "beacons.ai",
  "bio.link",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "ifood.com.br",
  "goo.gl",
  "g.page",
  "business.site", // Google's old free site builder, now discontinued
  "sites.google.com",
  "wixsite.com",
  "shopee.com.br",
  "mercadolivre.com.br",
  "olx.com.br",
  // Booking pages, forms and page builders: a link, but not the business's own site.
  "easybarber.com.br",
  "trinks.com",
  "booksy.com",
  "calendly.com",
  "wa.link",
  "forms.gle",
  "docs.google.com",
  "drive.google.com",
  "canva.com",
  "carrd.co",
  "taplink.cc",
  "campsite.bio",
  // Business directories: a listing of the store, not a site of its own.
  "guiamais.com",
  "guiamais.com.br",
  "telelistas.net",
  "apontador.com.br",
  "tripadvisor.com",
  "tripadvisor.com.br",
  "cylex.com.br",
  "solutudo.com.br",
  "yelp.com",
] as const;

/**
 * Public bodies. A public school or town hall is not a prospect, and its website
 * being down says nothing about a business that could buy a site.
 */
const GOVERNMENT_SUFFIXES = [".gov.br", ".jus.br", ".leg.br", ".mp.br", ".mil.br", ".def.br"] as const;

/**
 * Websites of large national brands, banks and chains. A franchise or branch that
 * lists only its brand's site has no site of its own, so it counts as "no own site"
 * (a lead), and the brand's site is never checked: its home page being slow or down
 * says nothing about this store.
 * Not exhaustive: add hosts here as they show up in real results.
 */
const BRAND_HOSTS = [
  "ipiranga.com.br",
  "shell.com.br",
  "petrobras.com.br",
  "mcdonalds.com.br",
  "burgerking.com.br",
  "bobs.com.br",
  "boticario.com.br",
  "natura.com.br",
  "bradesco.com.br",
  "itau.com.br",
  "santander.com.br",
  "bb.com.br",
  "sicredi.com.br",
  "sicoob.com.br",
  "correios.com.br",
  "magazineluiza.com.br",
  "americanas.com.br",
  "casasbahia.com.br",
  "carrefour.com.br",
  "drogasil.com.br",
  "drogaraia.com.br",
  "raiadrogasil.com.br",
  "renner.com.br",
  "cea.com.br",
  "marisa.com.br",
  "riachuelo.com.br",
  "havan.com.br",
  "leroymerlin.com.br",
  "telhanorte.com.br",
  "claro.com.br",
  "vivo.com.br",
  "tim.com.br",
  "oi.com.br",
  "unimed.coop.br",
] as const;

/**
 * Hosts that show up in "website" fields by mistake: free webmail home pages and
 * search engines. They say nothing about a site, so the business counts as having none.
 */
const NOT_A_SITE_HOSTS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.com.br",
  "uol.com.br",
  "bol.com.br",
  "ig.com.br",
  "terra.com.br",
  "google.com",
  "google.com.br",
  "bing.com",
] as const;

/**
 * - own: a site that belongs to the business
 * - social: a social page, directory, platform or brand site: something online, but
 *   not a site of its own
 * - institutional: a public body, not a prospect
 */
export type UrlKind = "none" | "social" | "own" | "institutional" | "invalid";

function hostMatches(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

export function classifyUrl(raw: string | null | undefined): UrlKind {
  if (!raw || !raw.trim()) return "none";

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return "invalid";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return "invalid";

  const host = url.hostname.toLowerCase();
  // Exact host only ("www." allowed): docs.google.com is a platform link, not noise.
  const bareHost = host.replace(/^www\./, "");
  if ((NOT_A_SITE_HOSTS as readonly string[]).includes(bareHost)) return "none";
  if (GOVERNMENT_SUFFIXES.some((suffix) => host.endsWith(suffix))) return "institutional";
  if (BRAND_HOSTS.some((domain) => hostMatches(host, domain))) return "social";
  if (SOCIAL_HOSTS.some((domain) => hostMatches(host, domain))) return "social";
  return "own";
}
