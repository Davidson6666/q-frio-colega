import http from "node:http";
import https from "node:https";
import net from "node:net";
import type { WebsiteStatus } from "./labels";
import { isPrivateAddress, safeLookup } from "./ssrf";

export interface CheckOptions {
  /** Total budget for one attempt, redirects included. */
  timeoutMs?: number;
  /** Time to first byte above this is "slow". */
  slowTtfbMs?: number;
  maxRedirects?: number;
  /** Stop reading the body after this many bytes. */
  maxBytes?: number;
  /** Pause before the single retry of an ambiguous failure. */
  retryDelayMs?: number;
  /** TEST ONLY. Disables the SSRF guard so a local test server can be reached. */
  allowPrivateNetwork?: boolean;
  /**
   * TEST ONLY. IP-literal hosts exempt from the guard while every other hop stays
   * protected. Lets a test verify that redirects are re-validated.
   */
  unsafeAllowHosts?: string[];
}

export interface CheckDetails {
  httpStatus: number | null;
  ttfbMs: number | null;
  finalUrl: string | null;
  /** Human-readable explanation, shown to the user as "check before approaching". */
  reason: string;
  hasViewport: boolean | null;
}

export interface CheckResult {
  status: WebsiteStatus;
  details: CheckDetails;
}

const DEFAULTS: Required<CheckOptions> = {
  timeoutMs: 8000,
  slowTtfbMs: 4000,
  maxRedirects: 5,
  maxBytes: 2 * 1024 * 1024,
  retryDelayMs: 1500,
  allowPrivateNetwork: false,
  unsafeAllowHosts: [],
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; GarimpoSiteCheck/1.0; verificacao de saude de site, uma unica pagina)";

type Attempt =
  | {
      kind: "response";
      status: number;
      headers: http.IncomingHttpHeaders;
      html: string;
      ttfbMs: number;
      finalUrl: string;
    }
  | { kind: "error"; code: string };

class NetworkError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

// ---------------------------------------------------------------------------
// Pure classification (unit tested without any network)
// ---------------------------------------------------------------------------

const VIEWPORT_META = /<meta\s[^>]*name\s*=\s*["']?viewport["']?/i;
const ANTIBOT_MARKERS = /just a moment|cf-chl|captcha|attention required|access denied|verify you are human/i;

function looksLikeAntiBot(headers: http.IncomingHttpHeaders, html: string) {
  const server = String(headers.server ?? "").toLowerCase();
  return (
    Boolean(headers["cf-ray"]) ||
    server.includes("cloudflare") ||
    server.includes("sucuri") ||
    ANTIBOT_MARKERS.test(html.slice(0, 4000))
  );
}

export function classifyResponse(
  input: {
    status: number;
    ttfbMs: number;
    html: string;
    headers: http.IncomingHttpHeaders;
    finalUrl: string;
  },
  slowTtfbMs: number,
): CheckResult {
  const { status, ttfbMs, html, headers, finalUrl } = input;
  const base = { httpStatus: status, ttfbMs: Math.round(ttfbMs), finalUrl };

  if (status >= 200 && status < 400) {
    const hasViewport = VIEWPORT_META.test(html);
    if (ttfbMs > slowTtfbMs) {
      return {
        status: "SLOW",
        details: {
          ...base,
          hasViewport,
          reason: `Demorou ${(ttfbMs / 1000).toFixed(1).replace(".", ",")} s para começar a responder.`,
        },
      };
    }
    if (!hasViewport) {
      return {
        status: "NOT_MOBILE",
        details: {
          ...base,
          hasViewport,
          reason: "A página não declara versão para celular (sem a meta viewport).",
        },
      };
    }
    return { status: "OK", details: { ...base, hasViewport, reason: "O site abre normalmente." } };
  }

  const details = { ...base, hasViewport: null };

  // Bot walls and rate limits say nothing about whether the site works for people.
  if (status === 401 || status === 403 || status === 429 || looksLikeAntiBot(headers, html)) {
    return {
      status: "UNKNOWN",
      details: {
        ...details,
        reason: `O site respondeu ${status} e parece bloquear checagens automáticas. Abra no navegador para confirmar.`,
      },
    };
  }

  if (status === 404 || status === 410) {
    return {
      status: "BROKEN",
      details: { ...details, reason: `A página inicial não existe (erro ${status}).` },
    };
  }

  if (status >= 500) {
    return {
      status: "BROKEN",
      details: { ...details, reason: `O servidor do site retornou erro ${status}, mesmo após uma nova tentativa.` },
    };
  }

  // Other 4xx (400, 405, 406, 451, 999...) are usually a server rejecting our
  // automated client, not proof that the site is broken for people.
  return {
    status: "UNKNOWN",
    details: {
      ...details,
      reason: `O site respondeu ${status} à checagem automática, o que pode ser só bloqueio de robôs. Abra no navegador para confirmar.`,
    },
  };
}

export function classifyNetworkError(code: string): CheckResult {
  const none = { httpStatus: null, ttfbMs: null, finalUrl: null, hasViewport: null };
  const result = (status: WebsiteStatus, reason: string): CheckResult => ({
    status,
    details: { ...none, reason },
  });

  switch (code) {
    case "ENOTFOUND":
      return result("BROKEN", "O domínio não existe ou não resolve (erro de DNS).");
    case "ECONNREFUSED":
      return result("BROKEN", "O servidor do site recusou a conexão.");
    case "CERT_HAS_EXPIRED":
      return result("BROKEN", "O certificado de segurança do site está vencido.");
    case "ERR_TLS_CERT_ALTNAME_INVALID":
      return result("BROKEN", "O certificado de segurança pertence a outro domínio.");
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "SELF_SIGNED_CERT_IN_CHAIN":
      return result("BROKEN", "O certificado de segurança não é confiável (autoassinado ou de emissor desconhecido) e os navegadores avisam o visitante.");
    case "TOO_MANY_REDIRECTS":
      return result("BROKEN", "O site entra em loop de redirecionamentos.");
    // Node does not fetch missing intermediate certificates the way browsers do,
    // so these often work fine for real visitors.
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
    case "UNABLE_TO_GET_ISSUER_CERT_LOCALLY":
      return result("UNKNOWN", "Cadeia de certificados incompleta. Navegadores costumam aceitar, mas confira.");
    case "ETIMEDOUT":
      return result("UNKNOWN", "Não respondeu em 8 s nas duas tentativas. Pode estar fora do ar ou bloqueando robôs.");
    case "EBLOCKED":
      return result("UNKNOWN", "Endereço interno bloqueado por segurança.");
    case "EAI_AGAIN":
    case "EHOSTUNREACH":
    case "ENETUNREACH":
      return result("UNKNOWN", "Falha temporária de rede ao acessar o site. Tente de novo.");
    default:
      return result("UNKNOWN", `Erro de rede (${code}). Confira manualmente.`);
  }
}

/** Failures worth exactly one more try before we draw a conclusion. */
export function isAmbiguous(attempt: Attempt): boolean {
  if (attempt.kind === "error") {
    return ["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN", "EPIPE", "ECONNABORTED"].includes(attempt.code);
  }
  return attempt.status >= 500 || attempt.status === 429;
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

function declaredCharset(contentType: string | undefined): string | null {
  return /charset\s*=\s*["']?([\w-]+)/i.exec(contentType ?? "")?.[1] ?? null;
}

/** <meta charset="..."> or the http-equiv form, looked up in the first bytes of the page. */
function sniffedCharset(body: Buffer): string | null {
  const head = body.subarray(0, 4096).toString("latin1");
  return /<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i.exec(head)?.[1] ?? null;
}

/**
 * Decodes a response using the charset the server or the page declares. Many older
 * Brazilian small-business sites are ISO-8859-1: read as UTF-8, "Pão" turns into
 * replacement characters and no accented name could ever match.
 */
export function decodeBody(body: Buffer, contentType: string | undefined): string {
  const declared = declaredCharset(contentType) ?? sniffedCharset(body);
  if (declared) {
    try {
      return new TextDecoder(declared).decode(body);
    } catch {
      // Unknown label: fall through to detection.
    }
  }
  const utf8 = body.toString("utf8");
  // Invalid UTF-8 shows up as U+FFFD. With nothing declared, Windows-1252 is the
  // usual legacy encoding for Brazilian pages.
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(body) : utf8;
}

function requestOnce(
  url: URL,
  o: Required<CheckOptions>,
  signal: AbortSignal,
  cookie?: string,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer; ttfbMs: number; started: number }> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const started = performance.now();

    const request = transport.request(
      url,
      {
        method: "GET",
        agent: false,
        signal,
        lookup: o.allowPrivateNetwork ? undefined : safeLookup,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          // No compression: we read raw bytes and cap them, no decompression bombs.
          "accept-encoding": "identity",
          "accept-language": "pt-BR,pt;q=0.9",
          ...(cookie ? { cookie } : {}),
        },
      },
      (response) => {
        const ttfbMs = performance.now() - started;
        const chunks: Buffer[] = [];
        let size = 0;
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks),
            ttfbMs,
            started,
          });
        };

        response.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          size += chunk.length;
          if (size >= o.maxBytes) {
            finish();
            response.destroy();
          }
        });
        response.on("end", finish);
        response.on("close", finish);
        response.on("error", (error) => {
          if (settled) return;
          settled = true;
          reject(error);
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

function errorCode(error: unknown): string {
  if (error instanceof NetworkError) return error.code;
  const err = error as NodeJS.ErrnoException & { cause?: unknown };
  if (err?.name === "AbortError" || err?.name === "TimeoutError" || err?.code === "ABORT_ERR") {
    return "ETIMEDOUT";
  }
  return err?.code ?? "UNKNOWN";
}

async function tryFetch(startUrl: string, o: Required<CheckOptions>): Promise<Attempt> {
  const signal = AbortSignal.timeout(o.timeoutMs);
  const startedAt = performance.now();

  try {
    let url = new URL(startUrl);
    // Minimal per-host cookie jar. Sites often redirect to set a cookie and come back;
    // browsers keep it and load fine, so without a jar that looks like a redirect loop.
    const jar = new Map<string, Map<string, string>>();

    for (let hop = 0; hop <= o.maxRedirects; hop++) {
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new NetworkError("EBLOCKED");
      }
      // IP literals skip DNS, so safeLookup never sees them: check them here.
      const host = url.hostname.replace(/^\[|\]$/g, "");
      const exempt = o.unsafeAllowHosts.includes(host);
      if (!o.allowPrivateNetwork && !exempt && net.isIP(host) && isPrivateAddress(host)) {
        throw new NetworkError("EBLOCKED");
      }

      const cookieHeader = [...(jar.get(url.hostname) ?? [])].map(([k, v]) => `${k}=${v}`).join("; ");
      const res = await requestOnce(url, o, signal, cookieHeader || undefined);

      for (const line of res.headers["set-cookie"] ?? []) {
        const [pair] = line.split(";");
        const eq = pair.indexOf("=");
        if (eq <= 0) continue;
        const host = jar.get(url.hostname) ?? new Map<string, string>();
        host.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
        jar.set(url.hostname, host);
      }

      const location = res.headers.location;
      if ([301, 302, 303, 307, 308].includes(res.status) && location) {
        url = new URL(location, url);
        continue;
      }

      return {
        kind: "response",
        status: res.status,
        headers: res.headers,
        html: decodeBody(res.body, res.headers["content-type"]),
        // Total time until the final page started answering, redirects included.
        ttfbMs: res.started + res.ttfbMs - startedAt,
        finalUrl: url.toString(),
      };
    }

    throw new NetworkError("TOO_MANY_REDIRECTS");
  } catch (error) {
    return { kind: "error", code: errorCode(error) };
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks the home page of one site and classifies it.
 * Ambiguous failures (timeout, 5xx, resets) are retried once; if still unclear
 * the result is UNKNOWN, never a confident "broken".
 */
export async function checkWebsite(url: string, options: CheckOptions = {}): Promise<CheckResult> {
  const o = { ...DEFAULTS, ...options };

  let attempt = await tryFetch(url, o);
  if (isAmbiguous(attempt)) {
    await sleep(o.retryDelayMs);
    attempt = await tryFetch(url, o);
  }

  if (attempt.kind === "error") return classifyNetworkError(attempt.code);

  const first = classifyResponse(attempt, o.slowTtfbMs);
  if (first.status !== "SLOW") return first;

  // One slow reading can be a cold start or a distant server region, so "slow"
  // is only reported when a second reading agrees. The better reading wins.
  const second = await tryFetch(url, o);
  if (second.kind === "response") {
    const again = classifyResponse(second, o.slowTtfbMs);
    if ((again.details.ttfbMs ?? Infinity) < (first.details.ttfbMs ?? Infinity)) return again;
  }
  return first;
}

/**
 * Fetches a home page and returns its HTML, through the same SSRF-protected
 * machinery as checkWebsite but without retries or classification. Used to look
 * for evidence on guessed domains, where a quick "no" is the common answer.
 */
export async function fetchHomepage(
  url: string,
  options: CheckOptions = {},
): Promise<{ ok: true; status: number; html: string; finalUrl: string } | { ok: false; code: string }> {
  const attempt = await tryFetch(url, { ...DEFAULTS, timeoutMs: 6000, ...options });
  if (attempt.kind === "error") return { ok: false, code: attempt.code };
  return { ok: true, status: attempt.status, html: attempt.html, finalUrl: attempt.finalUrl };
}
