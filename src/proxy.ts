import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only auth-related routes need a session refresh. Marketing pages stay fully
// static and are never routed through here.
export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*", "/login", "/cadastro"],
};
