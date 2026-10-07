import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, getUser } from "@/lib/auth/session";
import { isOnboardingComplete } from "@/lib/supabase/types";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

/**
 * Second line of defense behind proxy.ts: validates the session against the
 * Auth server and sends first-time users through onboarding.
 */
async function AuthGate({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  // Every auth user gets a profile row from a database trigger (plus a backfill
  // in the migration). Sending a user without one to onboarding cannot fix it,
  // because clients have no INSERT privilege: fail loudly instead of looping.
  if (!profile) throw new Error(`No profile row for user ${user.id}`);
  if (!isOnboardingComplete(profile)) redirect("/onboarding");

  return (
    <AppShell profile={profile} email={user.email}>
      {children}
    </AppShell>
  );
}

function ShellSkeleton() {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[17rem_1fr]" aria-hidden>
      <div className="hidden border-e border-line bg-surface p-5 lg:block">
        <Skeleton className="h-8 w-32" />
        <div className="mt-10 grid gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      </div>
      <div className="px-5 py-8 sm:px-8 lg:py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-8 h-48" />
      </div>
    </div>
  );
}
