import Link from "next/link";
import { OpportunityCard } from "@/components/app/opportunity-card";
import { buttonVariants } from "@/components/ui/button";
import { CtaLink } from "@/components/ui/cta-link";
import { SAMPLE_BUSINESSES } from "./sample-data";

/**
 * Asymmetric split hero. Left: one message and one action. Right: a Z-axis
 * cascade of real result cards (flat stack on small screens, no rotation).
 */
export function Hero() {
  const [first, second, third] = SAMPLE_BUSINESSES;

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(55%_60%_at_85%_8%,color-mix(in_oklab,var(--accent)_13%,transparent),transparent_70%)] pt-28 pb-20 lg:pt-24 lg:pb-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:min-h-[calc(100dvh-6rem)] lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <h1
            className="rise text-balance text-4xl font-semibold leading-[1.04] tracking-tighter sm:text-5xl lg:text-6xl"
            style={{ "--i": 0 } as React.CSSProperties}
          >
            Pare de procurar cliente no escuro.
          </h1>
          <p
            className="rise mt-6 max-w-[46ch] text-lg leading-relaxed text-muted"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Informe o que você vende e a cidade. Mostramos empresas com
            oportunidade real e a mensagem pronta para enviar.
          </p>
          <div
            className="rise mt-9 flex flex-wrap items-center gap-3"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <CtaLink href="/cadastro">Começar agora</CtaLink>
            <Link
              href="#como-funciona"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Ver como funciona
            </Link>
          </div>
        </div>

        <div
          className="rise lg:col-span-5"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <div
            role="group"
            aria-label="Exemplo de resultados de uma busca"
            className="relative grid gap-4 lg:block lg:h-[34.5rem]"
          >
            <div className="lg:absolute lg:start-2 lg:top-0 lg:w-[21rem]">
              <OpportunityCard business={first} className="lg:-rotate-2" />
            </div>
            <div className="lg:absolute lg:end-0 lg:top-36 lg:w-[21rem]">
              <OpportunityCard business={second} className="lg:rotate-2" />
            </div>
            <div className="hidden lg:absolute lg:start-0 lg:top-72 lg:block lg:w-[21rem]">
              <OpportunityCard business={third} className="lg:-rotate-1" />
            </div>
          </div>
          <p className="mt-4 text-xs text-muted lg:text-end">
            Resultados de exemplo com empresas fictícias.
          </p>
        </div>
      </div>
    </section>
  );
}
