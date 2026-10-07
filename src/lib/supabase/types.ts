import type { PlanId } from "@/config/plans";

/**
 * Mirrors the `profiles` table (supabase/migrations/20261007000000_profiles.sql).
 * Hand-written for now: once a Supabase project exists, generate it with
 * `supabase gen types typescript` and type the clients with the result.
 */
export interface Profile {
  id: string;
  name: string | null;
  whatsapp: string | null;
  services_offered: string[];
  default_city: string | null;
  plan: PlanId;
  credits_balance: number;
  credits_renew_at: string | null;
  created_at: string;
}

/** Onboarding is done once the user told us what they sell and where. */
export function isOnboardingComplete(profile: Profile | null): boolean {
  return Boolean(
    profile && profile.services_offered.length > 0 && profile.default_city,
  );
}
