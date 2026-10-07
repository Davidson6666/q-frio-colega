import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { Container, SectionTitle } from "./section";

const TEMPLATES = [
  {
    name: "Estúdio",
    description: "Projetos em destaque, com resultado e depoimento.",
    seed: "garimpo-portfolio-estudio",
  },
  {
    name: "Vitrine",
    description: "Grade de trabalhos para quem vende vários serviços menores.",
    seed: "garimpo-portfolio-vitrine",
  },
  {
    name: "Minimal",
    description: "Uma página só, direta, com o botão de contato no topo.",
    seed: "garimpo-portfolio-minimal",
  },
] as const;

/** Heading above, horizontal scroll-snap row of template covers below. */
export function PortfolioShowcase() {
  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-titulo"
      className="py-24 md:py-32"
    >
      <Container>
        <SectionTitle id="portfolio-titulo" className="max-w-[24ch]">
          Mande o portfólio junto com a proposta.
        </SectionTitle>
        <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-muted">
          Publique sua página com projetos, resultados e um botão direto para o
          seu WhatsApp. O link funciona bem no celular de quem recebe.
        </p>
      </Container>

      <div
        role="region"
        aria-label="Templates de portfólio"
        tabIndex={0}
        className="snap-row mt-12 flex gap-5 overflow-x-auto px-5 pb-2 sm:px-8 lg:ps-[max(2rem,calc((100vw-72rem)/2+2rem))]"
      >
        {TEMPLATES.map((template) => (
          <Reveal
            key={template.name}
            className="w-[17rem] shrink-0 sm:w-[20rem]"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface-2">
              <Image
                src={`https://picsum.photos/seed/${template.seed}/640/800`}
                alt=""
                fill
                sizes="(min-width: 640px) 320px, 272px"
                className="object-cover"
              />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">
              {template.name}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {template.description}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
