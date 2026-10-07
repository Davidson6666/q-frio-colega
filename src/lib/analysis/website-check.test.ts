import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  checkWebsite,
  classifyNetworkError,
  classifyResponse,
  type CheckOptions,
} from "./website-check";

const PAGE_OK = `<!doctype html><html><head><meta name="viewport" content="width=device-width"></head><body>Olá</body></html>`;
const PAGE_NO_VIEWPORT = `<!doctype html><html><head><title>x</title></head><body>Olá</body></html>`;

// Test-only options: reach 127.0.0.1 and do not wait long between attempts.
const local: CheckOptions = { allowPrivateNetwork: true, retryDelayMs: 10, timeoutMs: 1500 };

let server: http.Server;
let base: string;
const hits = new Map<string, number>();
const seen = (path: string) => hits.get(path) ?? 0;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const path = req.url ?? "/";
    hits.set(path, seen(path) + 1);

    switch (path) {
      case "/ok":
        res.writeHead(200, { "content-type": "text/html" }).end(PAGE_OK);
        return;
      case "/no-viewport":
        res.writeHead(200, { "content-type": "text/html" }).end(PAGE_NO_VIEWPORT);
        return;
      case "/slow":
        setTimeout(() => res.writeHead(200).end(PAGE_OK), 200);
        return;
      case "/404":
        res.writeHead(404).end("not found");
        return;
      case "/500":
        res.writeHead(500).end("boom");
        return;
      case "/flaky":
        // Fails the first time, works the second: the retry must recover it.
        if (seen(path) === 1) res.writeHead(500).end("boom");
        else res.writeHead(200).end(PAGE_OK);
        return;
      case "/forbidden":
        res.writeHead(403).end("no bots");
        return;
      case "/cloudflare":
        res.writeHead(503, { server: "cloudflare", "cf-ray": "abc" }).end("Just a moment...");
        return;
      case "/redirect":
        res.writeHead(301, { location: "/redirect-2" }).end();
        return;
      case "/redirect-2":
        res.writeHead(302, { location: "/ok" }).end();
        return;
      case "/loop":
        res.writeHead(302, { location: "/loop" }).end();
        return;
      case "/cookie-gate":
        // Sets a cookie and redirects back: fine in a browser, a "loop" without a cookie jar.
        if ((req.headers.cookie ?? "").includes("passed=1")) res.writeHead(200).end(PAGE_OK);
        else res.writeHead(302, { location: "/cookie-gate", "set-cookie": "passed=1; Path=/; HttpOnly" }).end();
        return;
      case "/400":
        res.writeHead(400).end("nope");
        return;
      case "/406":
        res.writeHead(406).end("nope");
        return;
      case "/slow-once":
        // Slow the first time only (cold start): must not be reported as slow.
        if (seen(path) === 1) setTimeout(() => res.writeHead(200).end(PAGE_OK), 200);
        else res.writeHead(200).end(PAGE_OK);
        return;
      case "/hang":
        return; // never answers
      default:
        res.writeHead(200).end(PAGE_OK);
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.closeAllConnections();
  server.close();
});

describe("checkWebsite", () => {
  it("OK for a healthy responsive page", async () => {
    const result = await checkWebsite(`${base}/ok`, local);
    expect(result.status).toBe("OK");
    expect(result.details.httpStatus).toBe(200);
    expect(result.details.hasViewport).toBe(true);
  });

  it("NOT_MOBILE when the viewport meta is missing", async () => {
    const result = await checkWebsite(`${base}/no-viewport`, local);
    expect(result.status).toBe("NOT_MOBILE");
    expect(result.details.hasViewport).toBe(false);
  });

  it("SLOW when time to first byte exceeds the threshold", async () => {
    const result = await checkWebsite(`${base}/slow`, { ...local, slowTtfbMs: 100 });
    expect(result.status).toBe("SLOW"); // confirmed by a second slow reading
    expect(result.details.ttfbMs).toBeGreaterThanOrEqual(100);
  });

  it("BROKEN for 404", async () => {
    const result = await checkWebsite(`${base}/404`, local);
    expect(result.status).toBe("BROKEN");
    expect(result.details.httpStatus).toBe(404);
  });

  it("BROKEN for a 500 that persists, after exactly one retry", async () => {
    hits.delete("/500");
    const result = await checkWebsite(`${base}/500`, local);
    expect(result.status).toBe("BROKEN");
    expect(seen("/500")).toBe(2);
  });

  it("recovers when the retry succeeds (transient failure is not broken)", async () => {
    hits.delete("/flaky");
    const result = await checkWebsite(`${base}/flaky`, local);
    expect(result.status).toBe("OK");
    expect(seen("/flaky")).toBe(2);
  });

  it("UNKNOWN for 403, without retrying", async () => {
    hits.delete("/forbidden");
    const result = await checkWebsite(`${base}/forbidden`, local);
    expect(result.status).toBe("UNKNOWN");
    expect(seen("/forbidden")).toBe(1);
  });

  it("UNKNOWN (not BROKEN) behind a Cloudflare challenge", async () => {
    const result = await checkWebsite(`${base}/cloudflare`, local);
    expect(result.status).toBe("UNKNOWN");
  });

  it("follows redirects", async () => {
    const result = await checkWebsite(`${base}/redirect`, local);
    expect(result.status).toBe("OK");
    expect(result.details.finalUrl).toBe(`${base}/ok`);
  });

  it("keeps cookies across redirects, so a cookie handshake is not a loop", async () => {
    const result = await checkWebsite(`${base}/cookie-gate`, local);
    expect(result.status).toBe("OK");
  });

  it.each(["/400", "/406"])("UNKNOWN (not BROKEN) for %s, which is usually a bot rejection", async (path) => {
    hits.delete(path);
    const result = await checkWebsite(`${base}${path}`, local);
    expect(result.status).toBe("UNKNOWN");
    expect(seen(path)).toBe(1);
  });

  it("does not report SLOW when a second reading is fast", async () => {
    hits.delete("/slow-once");
    const result = await checkWebsite(`${base}/slow-once`, { ...local, slowTtfbMs: 100 });
    expect(result.status).toBe("OK");
    expect(seen("/slow-once")).toBe(2);
  });

  it("BROKEN for a redirect loop", async () => {
    const result = await checkWebsite(`${base}/loop`, local);
    expect(result.status).toBe("BROKEN");
    expect(result.details.reason).toContain("loop");
  });

  it("UNKNOWN when the site never answers, after two attempts", async () => {
    hits.delete("/hang");
    const result = await checkWebsite(`${base}/hang`, { ...local, timeoutMs: 250 });
    expect(result.status).toBe("UNKNOWN");
    expect(seen("/hang")).toBe(2);
  });

  it("BROKEN when the connection is refused", async () => {
    // Grab a free port, then close it so nothing is listening there.
    const probe = http.createServer();
    await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
    const port = (probe.address() as AddressInfo).port;
    await new Promise((resolve) => probe.close(resolve));

    const result = await checkWebsite(`http://127.0.0.1:${port}/`, local);
    expect(result.status).toBe("BROKEN");
    expect(result.details.reason).toContain("recusou");
  });
});

describe("checkWebsite SSRF guard (default options)", () => {
  const strict: CheckOptions = { retryDelayMs: 10, timeoutMs: 1500 };

  it("never contacts a loopback address", async () => {
    hits.delete("/ok");
    const result = await checkWebsite(`${base}/ok`, strict);
    expect(result.status).toBe("UNKNOWN");
    expect(result.details.reason).toContain("bloqueado");
    expect(seen("/ok")).toBe(0);
  });

  it.each([
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://localhost/",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.5/",
    "http://192.168.0.1/",
    "http://[::ffff:127.0.0.1]/",
    "http://0x7f000001/", // hex form of 127.0.0.1, normalized by the URL parser
  ])("blocks %s", async (url) => {
    const result = await checkWebsite(url, strict);
    expect(result.status).toBe("UNKNOWN");
    expect(result.details.reason).toContain("bloqueado");
  });

  it("blocks a redirect that points to an internal address", async () => {
    const redirector = http.createServer((_req, res) => {
      res.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" }).end();
    });
    await new Promise<void>((resolve) => redirector.listen(0, "127.0.0.1", resolve));
    const port = (redirector.address() as AddressInfo).port;
    try {
      // Only the first hop (our test server) is exempt. The redirect target is not,
      // so a result of "blocked" proves each hop is re-validated.
      const result = await checkWebsite(`http://127.0.0.1:${port}/`, {
        ...strict,
        unsafeAllowHosts: ["127.0.0.1"],
      });
      expect(result.status).toBe("UNKNOWN");
      expect(result.details.reason).toContain("bloqueado");
      expect(result.details.httpStatus).toBeNull(); // never got a response from the target
    } finally {
      redirector.close();
    }
  });
});

describe("classifyNetworkError", () => {
  it("is confident only about clear failures", () => {
    expect(classifyNetworkError("ENOTFOUND").status).toBe("BROKEN");
    expect(classifyNetworkError("ECONNREFUSED").status).toBe("BROKEN");
    expect(classifyNetworkError("CERT_HAS_EXPIRED").status).toBe("BROKEN");
    expect(classifyNetworkError("ERR_TLS_CERT_ALTNAME_INVALID").status).toBe("BROKEN");
    expect(classifyNetworkError("TOO_MANY_REDIRECTS").status).toBe("BROKEN");
  });

  it("does not condemn a site for things browsers tolerate or that look transient", () => {
    expect(classifyNetworkError("UNABLE_TO_VERIFY_LEAF_SIGNATURE").status).toBe("UNKNOWN");
    expect(classifyNetworkError("ETIMEDOUT").status).toBe("UNKNOWN");
    expect(classifyNetworkError("ECONNRESET").status).toBe("UNKNOWN");
    expect(classifyNetworkError("EAI_AGAIN").status).toBe("UNKNOWN");
    expect(classifyNetworkError("SOMETHING_NEW").status).toBe("UNKNOWN");
  });
});

describe("classifyResponse", () => {
  const input = (status: number, ttfbMs = 100, html = PAGE_OK) => ({
    status,
    ttfbMs,
    html,
    headers: {},
    finalUrl: "https://exemplo.com.br/",
  });

  it("prefers SLOW over NOT_MOBILE when both apply", () => {
    expect(classifyResponse(input(200, 5000, PAGE_NO_VIEWPORT), 4000).status).toBe("SLOW");
  });

  it("treats 3xx without a Location as reachable", () => {
    expect(classifyResponse(input(304), 4000).status).toBe("OK");
  });

  it("formats the slow reason with a comma decimal", () => {
    expect(classifyResponse(input(200, 5200), 4000).details.reason).toContain("5,2 s");
  });
});
