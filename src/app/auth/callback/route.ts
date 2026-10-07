import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_NEXT_COOKIE } from "@/lib/auth/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
];

/**
 * Landing point for OAuth (Google) and e-mail confirmation links.
 *
 * Two ways in:
 * - `code` (PKCE): the browser that started the flow holds the verifier cookie.
 * - `token_hash` + `type`: works even when the link is opened on another device.
 *   Requires the e-mail template to link here (see README).
 *
 * Where to go afterwards comes from a short-lived cookie set before the redirect,
 * so the callback URL stays free of query strings and matches Supabase's
 * redirect allow-list exactly.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const cookieStore = await cookies();
  const next = safeNextPath(cookieStore.get(AUTH_NEXT_COOKIE)?.value);
  cookieStore.delete(AUTH_NEXT_COOKIE);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    let error: unknown = new Error("missing credentials");

    if (code) {
      ({ error } = await supabase.auth.exchangeCodeForSession(code));
    } else if (tokenHash && type && OTP_TYPES.includes(type)) {
      ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
    }

    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/login?erro=link", request.url));
}
