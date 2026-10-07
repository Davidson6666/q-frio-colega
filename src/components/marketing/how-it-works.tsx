import {
  ChatCircleText,
  Crosshair,
  MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/reveal";
import { Eyebrow, Section, SectionTitle } from "./section";

const STEPS = [
  {
    icon: MagnifyingGlass,
    title: "Diga o que você vende e onde",
    body: "Escolha o nicho, a cidade e o serviço. A busca respeita o limite do seu plano e não cobra duas vezes pela mesma empresa.",
  },
  {
    icon: Crosshair,
    title: "Veja quem tem a oportunidade",
    body: "Cada empresa chega com diagnóstico: sem site, site fora do ar, só rede social, lento ou sem agendamento online.",
  },
  {
    icon: ChatCircleText,
    title: "Abra a conversa com texto pronto",
    body: "Duas versões de mensagem, com um fato verdadeiro sobre o negócio. Você revisa e envia pelo seu WhatsApp.",
  },
] as const;

/** Sticky title on the left, vertical stepper on the right. */
export function HowItWorks() {
  return (
    <Section id="como-funciona" labelledBy="como-funciona-titulo">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Eyebrow>Como funciona</Eyebrow>
            <SectionTitle id="como-funciona-titulo" className="mt-5">
              Da busca à primeira mensagem, sem planilha.
            </SectionTitle>
          </div>
        </div>

        <ol className="lg:col-span-7">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === STEPS.length - 1;
            return (
              <Reveal as="li" key={step.title} className="relative flex gap-6 pb-14 last:pb-0">
                {!isLast ? (
                  <span
                    aria-hidden
                    className="absolute start-6 top-14 bottom-2 w-px -translate-x-1/2 bg-line"
                  />
                ) : null}
                <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <Icon size={24} weight="light" aria-hidden />
                </span>
                <div className="pt-1.5">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[52ch] leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
