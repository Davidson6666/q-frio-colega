import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlan } from "@/config/plans";
import type { Profile } from "@/lib/supabase/types";

/** Plan, credit balance and sign-out. Shared by the sidebar and the mobile menu. */
export function AccountSummary({
  profile,
  email,
}: {
  profile: Profile;
  email: string | undefined;
}) {
  const plan = getPlan(profile.plan);

  return (
    <div className="grid gap-3">
      <div className="rounded-field bg-surface-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Plano {plan.name}</span>
          <Badge tone={plan.id === "free" ? "neutral" : "accent"}>
            {plan.id === "free" ? "Sem prospecção" : "Ativo"}
          </Badge>
        </div>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-medium tabular-nums">
            {profile.credits_balance}
          </span>
          <span className="text-sm text-muted">créditos</span>
        </p>
        {plan.id === "free" ? (
          <Link
            href="/precos"
            className="mt-3 inline-block text-sm font-medium text-accent-ink underline underline-offset-4"
          >
            Ver planos
          </Link>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-1">
        <p className="min-w-0 truncate text-sm text-muted" title={email}>
          {profile.name ?? email}
        </p>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </div>
    </div>
  );
}
