import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, accessState, hasAccess } from "@/lib/access";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Returns a 401 response when the request has no access, otherwise null. */
export function denyIfNoAccess(request: NextRequest) {
  const state = accessState(request.cookies.get(SESSION_COOKIE)?.value);
  return hasAccess(state) ? null : jsonError("Não autorizado.", 401);
}

/** Parses a JSON request body, answering with null instead of throwing. */
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
