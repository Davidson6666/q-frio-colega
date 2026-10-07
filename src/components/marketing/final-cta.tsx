import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./section";

/** Closing call to action: one solid accent panel, one message, one action. */
export function FinalCta() {
  return (
    <section className="pb-24 md:pb-32" aria-labelledby="cta-titulo">
      <Container>
        <div className="rounded-[2rem] bg-accent px-7 py-16 text-accent-foreground md:px-16 md:py-24">
          <h2
            id="cta-titulo"
            className="max-w-[20ch] text-balance text-3xl font-semibold leading-[1.08] tracking-tighter md:text-5xl"
          >
            Seu próximo cliente provavelmente já está no mapa.
          </h2>
          <Link
            href="/cadastro"
            className="group mt-10 inline-flex h-14 items-center gap-2 rounded-full bg-accent-foreground ps-7 pe-2 text-base font-medium text-accent transition-transform duration-500 ease-spring active:scale-[0.98]"
          >
            Começar agora
            <span className="grid size-10 place-items-center rounded-full bg-accent/10 transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
              <ArrowRight size={18} aria-hidden />
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
