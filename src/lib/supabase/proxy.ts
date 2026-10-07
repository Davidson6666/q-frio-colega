import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = ["/app", "/onboarding"];
const AUTH_PAGES = ["/login", "/cadastro"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase session cookies and applies coarse route protection.
 *
 * This is a first line of defense only: protected pages re-check the user on the
 * server (see lib/auth/session.ts) and RLS enforces access at the database.
 */
export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const env = getSupabaseEnv();
  const isProtected = matches(pathname, PROTECTED_PREFIXES);

  // Without Supabase configured the public site still works; protected routes
  // send the visitor to /login, which explains what is missing.
  if (!env) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getClaims() validates the JWT signature and refreshes it when needed.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  if (!isAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(url, response);
  }

  if (isAuthenticated && matches(pathname, AUTH_PAGES)) {
    // getClaims() only checks the JWT signature locally, so a revoked session
    // (signed out elsewhere, user deleted) still looks valid until it expires.
    // AuthGate validates against the Auth server and would send that user back
    // to /login, so we must agree with it here or the two redirects loop.
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      url.search = "";
      return redirectWithCookies(url, response);
    }
  }

  return response;
}

/** A redirect must carry over any refreshed auth cookies from `source`. */
function redirectWithCookies(url: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
