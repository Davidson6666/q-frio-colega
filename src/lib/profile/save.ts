import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ProfileUpdate {
  name?: string;
  services_offered: string[];
  default_city: string;
  whatsapp: string | null;
}

/**
 * Updates only the columns a user is allowed to change (the database enforces
 * the same list with column-level grants). Returns false when nothing changed,
 * e.g. because the profile row does not exist: Supabase reports no error for an
 * UPDATE that matches zero rows, so we check the returned rows explicitly.
 */
export async function saveProfile(userId: string, update: ProfileUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select("id");

  return !error && Array.isArray(data) && data.length === 1;
}
