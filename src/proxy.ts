import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, accessState, hasAccess } from "@/lib/access";

/**
 * Everything except the login page requires access. API routes answer 401 JSON
 * instead of redirecting. Route handlers check again on their own, so this is a
 * convenience layer and not the only defense.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const state = accessState(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/entrar";

  if (hasAccess(state)) {
    // Nothing to log into when already inside (or when the gate is off).
    if (isLogin) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (isLogin) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/entrar", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
