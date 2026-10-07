import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeading, OrDivider } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, string> = {
  oauth: "Não foi possível entrar com o Google. Tente novamente ou use e-mail e senha.",
  link: "O link expirou ou já foi usado. Entre com e-mail e senha.",
  config:
    "O Supabase ainda não foi configurado neste ambiente. Veja o passo a passo no README.",
};

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="grid gap-8">
      <AuthHeading
        title="Entrar"
        subtitle="Acesse suas buscas, leads e conversas."
      />
      <Suspense fallback={<LoginSkeleton />}>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginContent({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const code = typeof params.erro === "string" ? params.erro : undefined;
  const notice = code
    ? NOTICES[code]
    : isSupabaseConfigured()
      ? undefined
      : NOTICES.config;

  return (
    <div className="grid gap-6">
      <GoogleButton next={next} />
      <OrDivider />
      <LoginForm next={next} notice={notice} />
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="grid gap-6" aria-hidden>
      <Skeleton className="h-12 rounded-full" />
      <Skeleton className="h-4" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
      <Skeleton className="h-14 rounded-full" />
    </div>
  );
}
