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

export type UrlKind = "none" | "social" | "own" | "invalid";

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
  if (SOCIAL_HOSTS.some((domain) => hostMatches(host, domain))) return "social";
  return "own";
}
