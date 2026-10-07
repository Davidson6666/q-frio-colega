import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/app/onboarding-form";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getProfile, getUser } from "@/lib/auth/session";
import { isOnboardingComplete } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Primeiros passos" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Logo href="/app" />
        <ThemeToggle />
      </div>
      <main id="conteudo" className="flex flex-1 items-center py-12">
        <div className="mx-auto w-full max-w-xl">
          <Suspense fallback={<OnboardingSkeleton />}>
            <OnboardingContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function OnboardingContent() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (isOnboardingComplete(profile)) redirect("/app");

  return (
    <OnboardingForm
      initialServices={profile?.services_offered ?? []}
      initialCity={profile?.default_city ?? ""}
    />
  );
}

function OnboardingSkeleton() {
  return (
    <div className="grid gap-8" aria-hidden>
      <Skeleton className="h-8" />
      <Skeleton className="h-10 w-3/4" />
      <div className="flex flex-wrap gap-2.5">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-32 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-full" />
    </div>
  );
}
