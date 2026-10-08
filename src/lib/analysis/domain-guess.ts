import { normalizeText } from "@/lib/geo/states";

/**
 * "Does this store have a site the data does not know about?"
 *
 * Builds a few domains from the store name (pizzariafornetto.com.br) and, when one
 * answers, checks that the page really belongs to this store. A match is only a
 * hint for the user to verify: it never changes a store from "no site" to "has site"
 * on its own, which is why the UI calls it "possible site".
 */

/** Words that say what a store is or how a company is registered, not who it is. */
const GENERIC_WORDS = new Set([
  "de", "do", "da", "dos", "das", "e", "em", "a", "o", "as", "os", "no", "na",
  "barbearia", "barber", "barbershop", "shop", "salao", "cabeleireiro", "cabeleireira", "studio", "estudio",
  "loja", "lojas", "clinica", "farmacia", "drogaria", "restaurante", "pizzaria", "hamburgueria", "padaria",
  "mercado", "supermercado", "oficina", "mecanica", "auto", "pet", "academia", "escola", "colegio",
  "imobiliaria", "imoveis", "advocacia", "advogado", "advogados", "contabilidade", "centro", "grupo",
  "ltda", "me", "eireli", "epp", "sa", "dr", "dra", "doutor", "doutora",
  "central", "center",
]);

const TLDS = [".com.br", ".com"];
const MIN_SLUG = 5;
const MAX_SLUG = 30;
/** Shorter words are too common to prove a page belongs to a store. */
const MIN_TOKEN = 4;
/** Only this much of a page is read for evidence (title, header, contact area). */
const EVIDENCE_CHARS = 150_000;

function words(value: string): string[] {
  return normalizeText(value).replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
}

/** Words of a store name that identify it, leaving out generic and city words. */
export function distinctiveWords(name: string, city: string): string[] {
  const cityWords = new Set(words(city));
  return words(name).filter((word) => !GENERIC_WORDS.has(word) && !cityWords.has(word));
}

/**
 * Hosts worth trying for a store, at most four: the whole name and the
 * distinctive part, each on .com.br and .com.
 */
export function guessCandidates(name: string, city: string): string[] {
  // Evidence needs a distinctive word of 4+ letters. Without one nothing could ever
  // be confirmed, so guessing domains would only waste requests.
  if (!distinctiveWords(name, city).some((word) => word.length >= MIN_TOKEN)) return [];

  const cityWords = new Set(words(city));
  const all = words(name).filter((word) => !cityWords.has(word));
  const slugs = new Set<string>([all.join(""), distinctiveWords(name, city).join("")]);

  return [...slugs]
    .filter((slug) => slug.length >= MIN_SLUG && slug.length <= MAX_SLUG)
    .flatMap((slug) => TLDS.map((tld) => `${slug}${tld}`));
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", nbsp: " ", quot: '"', apos: "'",
  atilde: "ã", otilde: "õ", aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  agrave: "à", acirc: "â", ecirc: "ê", ocirc: "ô", ccedil: "ç",
  Atilde: "Ã", Otilde: "Õ", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  Acirc: "Â", Ecirc: "Ê", Ocirc: "Ô", Ccedil: "Ç",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Math.min(Number(code), 0x10ffff)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Math.min(parseInt(code, 16), 0x10ffff)))
    .replace(/&([a-zA-Z]+);/g, (whole, entity: string) => NAMED_ENTITIES[entity] ?? whole);
}

/** Visible text of a page, roughly: no scripts or styles, no tags, entities decoded. */
export function pageText(html: string): string {
  // Scripts and styles are removed BEFORE cutting to the budget: a big inline script
  // in <head> (common on site builders) would otherwise use it all up before any text.
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(visible.slice(0, EVIDENCE_CHARS));
}

export interface Evidence {
  name: boolean;
  city: boolean;
  phone: boolean;
  /** The page title (or site name) contains the whole store name. */
  title: boolean;
  /** The page links to a social profile the data already knows for this store. */
  social: boolean;
}

/**
 * "facebook.com/fiodanavalha" for https://www.facebook.com/fiodanavalha/?ref=x.
 * A page that links to the store's own social profile is the store's own page:
 * the most reliable sign there is, and one a namesake in another city cannot fake.
 */
export function socialNeedles(urls: string[]): string[] {
  const needles: string[] = [];
  for (const raw of urls) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    const host = url.hostname.toLowerCase().replace(/^(www|m|pt-br|web)\./, "");
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    // "/" or "/pages" alone identify nothing.
    if (path.length < 6) continue;
    needles.push(`${host}${path}`);
  }
  return needles;
}

/** Page title, site name and share title: where a site usually states who it is. */
export function pageTitles(html: string): string[] {
  // The whole fetched page (already capped when downloaded): share tags often come
  // after a large inline style or script.
  const head = html;
  const titles: string[] = [];

  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1];
  if (title) titles.push(title);

  for (const match of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (/(?:property|name)\s*=\s*["'](?:og:site_name|og:title)["']/i.test(tag)) {
      const content = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(tag);
      const value = content?.[1] ?? content?.[2];
      if (value) titles.push(value);
    }
  }
  return titles.map(decodeEntities);
}

/** Letters and digits only, no accents, no spaces: "Rad Imagem" and "Radimagem" compare equal. */
const squash = (value: string) => normalizeText(value).replace(/[^a-z0-9]/g, "");

/** Whole-word match on normalized text: "silva" must not match inside "silvana". */
function hasWord(haystack: string, phrase: string): boolean {
  if (!phrase) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(haystack);
}

/**
 * Whether `haystack` contains the profile path as a complete handle and not as the
 * start of a longer one: "instagram.com/loja" is not "instagram.com/loja_studio".
 */
function containsHandle(haystack: string, needle: string): boolean {
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    const next = haystack[at + needle.length] ?? "";
    const after = haystack[at + needle.length + 1] ?? "";
    const continues = /[a-z0-9_]/.test(next) || (next === "." && /[a-z0-9_]/.test(after));
    if (!continues) return true;
    from = at + 1;
  }
}

/**
 * Phone-like numbers on the page, digits only, one entry per number. Looking at
 * numbers one by one (not at every digit on the page glued together) stops digits
 * of different numbers, prices or postcodes from adding up to a false match.
 */
function phoneNumbersOn(text: string): string[] {
  return (text.match(/\+?\d(?:[ ().-]?\d){7,}/g) ?? [])
    .map((raw) => raw.replace(/\D/g, ""))
    // Landline 10, mobile 11, plus country code: 12 to 13. Longer runs are two numbers glued.
    .filter((digits) => digits.length >= 8 && digits.length <= 14);
}

/**
 * What on the page ties it to this store. `name` needs every distinctive word of
 * the name as a whole word, and a single word only when it is 6+ letters ("Silva" is
 * a surname of thousands of businesses); `phone` compares the last 8 digits, so a
 * number written with or without the area code still matches.
 */
export function evaluateEvidence(input: {
  html: string;
  name: string;
  city: string;
  phones: string[];
  /** Social profile URLs already known for the store. */
  socials?: string[];
}): Evidence {
  const rawLower = input.html.toLowerCase();
  const text = pageText(input.html);
  const normalized = normalizeText(text);
  const numbers = phoneNumbersOn(text);

  const tokens = distinctiveWords(input.name, input.city).filter((word) => word.length >= MIN_TOKEN);
  const city = normalizeText(input.city);

  // The whole name, not one word: "Pet shop Bufalo" must not match "Associacao ... de Bufalo".
  // The distinctive part alone is accepted only when it has two or more words.
  const fullName = squash(words(input.name).filter((word) => !new Set(words(input.city)).has(word)).join(" "));
  const distinctive = distinctiveWords(input.name, input.city);
  const titleSlugs = [fullName, ...(distinctive.length >= 2 ? [squash(distinctive.join(" "))] : [])].filter(
    (slug) => slug.length >= MIN_SLUG,
  );
  const titles = pageTitles(input.html).map(squash);

  return {
    social: socialNeedles(input.socials ?? []).some((needle) => containsHandle(rawLower, needle)),
    title: titleSlugs.some((slug) => titles.some((title) => title.includes(slug))),
    name:
      tokens.length > 0 &&
      (tokens.length >= 2 || tokens[0].length >= 6) &&
      tokens.every((token) => hasWord(normalized, token)),
    city: hasWord(normalized, city),
    phone: input.phones.some((phone) => {
      const own = phone.replace(/\D/g, "");
      return own.length >= 8 && numbers.some((found) => found.endsWith(own.slice(-8)));
    }),
  };
}

/** How far to trust a guessed site. */
export type Strength = "strong" | "weak";

/** Smallest name (letters only) that may be trusted from the title alone. */
const MIN_TITLE_ONLY_SLUG = 9;

/**
 * - strong: the page links to the store's own social profile, or it states the
 *   store's name together with its city or phone number.
 * - weak: only the title carries the whole name. Accepted just on a .com.br host
 *   (Brazilian business) and for a name of 9+ letters, because short or generic
 *   names collide with unrelated companies ("mendes.com", "babykids.com").
 * - null: not enough. A single matching word is never enough: "Pet shop Bufalo"
 *   matches an association of buffalo breeders.
 *
 * `host` is the hostname that was guessed, e.g. "pizzariafornetto.com.br".
 */
export function evidenceStrength(evidence: Evidence, host: string): Strength | null {
  const namesStore = evidence.name || evidence.title;
  if (evidence.social || (namesStore && (evidence.city || evidence.phone))) return "strong";

  const label = host.endsWith(".com.br") ? host.slice(0, -".com.br".length) : "";
  if (evidence.title && label.length >= MIN_TITLE_ONLY_SLUG) return "weak";
  return null;
}

/** Human-readable list for the card, e.g. ["nome", "cidade"]. */
export function describeEvidence(evidence: Evidence): string[] {
  return [
    ...(evidence.social ? ["mesma rede social"] : []),
    ...(evidence.title ? ["nome no título"] : []),
    ...(evidence.name && !evidence.title ? ["nome"] : []),
    ...(evidence.city ? ["cidade"] : []),
    ...(evidence.phone ? ["telefone"] : []),
  ];
}
