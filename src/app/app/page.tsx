import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { buttonVariants } from "@/components/ui/button";
import { getPlan } from "@/config/plans";
import { serviceLabel } from "@/config/services";
import { getProfile, getUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Painel" };

const STAGES = [
  "Novos",
  "Contatados",
  "Responderam",
  "Negociando",
  "Fechados",
  "Perdidos",
] as const;

export default async function DashboardPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!profile) return null; // The layout already redirects when there is no profile.

  const plan = getPlan(profile.plan);
  const firstName =
    profile.name?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "";
  const canProspect = plan.features.prospecting;

  return (
    <div className="grid gap-10">
      <header>
        <h1 className="text-balance text-3xl font-semibold tracking-tighter md:text-4xl">
          Olá, {firstName}
        </h1>
        <p className="mt-2 text-muted">
          {canProspect
            ? "Seu painel de prospecção."
            : "Sua conta está pronta. Falta ativar um plano para começar a prospectar."}
        </p>
      </header>

      {!canProspect ? (
        <section
          aria-labelledby="ativar-plano"
          className="flex flex-col gap-5 rounded-card bg-accent-soft p-7 text-accent-ink md:flex-row md:items-center md:justify-between md:p-9"
        >
          <div>
            <h2 id="ativar-plano" className="text-xl font-semibold tracking-tight">
              Ative um plano para prospectar
            </h2>
            <p className="mt-2 max-w-[56ch] leading-relaxed">
              O plano Pro inclui {getPlan("pro").monthlyCredits} créditos por
              mês, buscas de até {getPlan("pro").leadsPerSearch} empresas e o
              agente de vendas.
            </p>
          </div>
          <Link
            href="/precos"
            className={buttonVariants({
              variant: "primary",
              size: "md",
              className: "shrink-0",
            })}
          >
            Ver planos
          </Link>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <section
          aria-labelledby="creditos"
          className="rounded-card border border-line bg-surface p-7 shadow-soft lg:col-span-2"
        >
          <h2 id="creditos" className="text-sm font-medium text-muted">
            Créditos disponíveis
          </h2>
          <p className="mt-3 font-mono text-5xl font-medium tabular-nums tracking-tight">
            {profile.credits_balance}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Os créditos renovam todo mês e não acumulam.
          </p>
        </section>

        <section
          aria-labelledby="perfil-busca"
          className="rounded-card border border-line bg-surface p-7 shadow-soft lg:col-span-3"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id="perfil-busca" className="text-sm font-medium text-muted">
              O que você vende e onde
            </h2>
            <Link
              href="/app/perfil"
              className="text-sm font-medium text-accent-ink underline underline-offset-4"
            >
              Editar
            </Link>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {profile.services_offered.map((id) => (
              <li
                key={id}
                className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent-ink"
              >
                {serviceLabel(id)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Cidade principal:{" "}
            <span className="font-medium text-foreground">
              {profile.default_city}
            </span>
          </p>
        </section>
      </div>

      <section aria-labelledby="buscas-recentes">
        <h2 id="buscas-recentes" className="text-xl font-semibold tracking-tight">
          Buscas recentes
        </h2>
        <div className="mt-4 flex flex-col items-start gap-4 rounded-card border border-dashed border-field p-8 md:flex-row md:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
            <MagnifyingGlass size={24} weight="light" aria-hidden />
          </span>
          <div>
            <p className="font-medium">Nenhuma busca ainda</p>
            <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-muted">
              {canProspect
                ? "A busca por nicho e cidade chega em breve. Quando estiver no ar, suas buscas aparecem aqui."
                : "A prospecção está disponível nos planos Pro e King. Suas buscas aparecem aqui depois que você ativar um plano."}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="leads-estagio">
        <h2 id="leads-estagio" className="text-xl font-semibold tracking-tight">
          Leads por estágio
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((stage) => (
            <div key={stage}>
              <dt className="text-sm text-muted">{stage}</dt>
              <dd className="mt-1 font-mono text-2xl font-medium tabular-nums">0</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
