import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/lib/supabase/types";

/**
 * Authoritative current user (validated against the Supabase Auth server).
 * `cache` dedupes the lookup within a single request.
 * Call only inside a Suspense boundary: it reads cookies().
 */
export const getUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, name, whatsapp, services_offered, default_city, plan, credits_balance, credits_renew_at, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
});

/** Redirects to /login when there is no session. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
