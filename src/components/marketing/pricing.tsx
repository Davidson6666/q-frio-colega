import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import {
  CREDIT_COSTS,
  PLANS,
  formatPrice,
  type PlanId,
} from "@/config/plans";
import { cn } from "@/lib/utils";
import { Eyebrow, Section, SectionTitle } from "./section";

const ORDER: PlanId[] = ["free", "pro", "king"];

const CTA: Record<PlanId, { label: string; href: string }> = {
  free: { label: "Começar agora", href: "/cadastro" },
  pro: { label: "Assinar Pro", href: "/cadastro?plano=pro" },
  king: { label: "Assinar King", href: "/cadastro?plano=king" },
};

/** Three plans side by side. Pro is highlighted. All numbers come from config/plans.ts. */
export function Pricing({ headingAs = "h2" }: { headingAs?: "h1" | "h2" }) {
  return (
    <Section id="precos" labelledBy="precos-titulo">
      <Eyebrow>Planos</Eyebrow>
      <SectionTitle
        id="precos-titulo"
        as={headingAs}
        className="mt-5 max-w-[24ch]"
      >
        Comece de graça, assine quando for prospectar.
      </SectionTitle>

      <div className="mt-14 grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {ORDER.map((id) => {
          const plan = PLANS[id];
          const featured = id === "pro";
          const cta = CTA[id];

          return (
            <Reveal
              key={id}
              className={cn(
                "rounded-card p-1.5 ring-1",
                featured ? "bg-accent-soft ring-accent" : "bg-foreground/[0.04] ring-line",
              )}
            >
              <div className="flex h-full flex-col rounded-[calc(1.5rem-0.375rem)] bg-surface p-7 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {plan.name}
                  </h3>
                  {featured ? <Badge tone="accent">Recomendado</Badge> : null}
                </div>

                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tighter">
                    {formatPrice(plan.priceCents)}
                  </span>
                  {plan.priceCents > 0 ? (
                    <span className="text-muted">/mês</span>
                  ) : null}
                </p>

                <ul className="mt-7 grid flex-1 content-start gap-3.5">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                      <Check
                        size={18}
                        weight="bold"
                        className="mt-0.5 shrink-0 text-accent-ink"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={cta.href}
                  className={buttonVariants({
                    variant: featured ? "primary" : "secondary",
                    size: "md",
                    className: "mt-8 w-full",
                  })}
                >
                  {cta.label}
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-8 grid max-w-[68ch] gap-2 text-sm leading-relaxed text-muted">
        <p>
          Como os créditos são usados: {CREDIT_COSTS.searchPerBusiness} por
          empresa encontrada, {CREDIT_COSTS.deepAnalysis} por análise profunda
          e {CREDIT_COSTS.openingMessage} por mensagem de abertura gerada.
        </p>
        <p>
          Os créditos renovam todo mês e não acumulam. Você pode cancelar
          quando quiser: o plano segue ativo até o fim do período pago.
        </p>
      </div>
    </Section>
  );
}
