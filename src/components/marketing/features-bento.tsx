import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { WEBSITE_STATUS_META } from "@/lib/analysis/labels";
import { Section, SectionTitle } from "./section";

const DIAGNOSIS: Array<keyof typeof WEBSITE_STATUS_META> = [
  "NO_WEBSITE",
  "BROKEN",
  "SOCIAL_ONLY",
  "NOT_MOBILE",
];

/**
 * Bento with exactly four cells: one tall image cell (left, spans two rows),
 * two stacked cells on the right, and one wide cell below.
 */
export function FeaturesBento() {
  return (
    <Section id="recursos" labelledBy="recursos-titulo">
      <SectionTitle id="recursos-titulo" className="max-w-[22ch]">
        Tudo para chegar no cliente sem improviso.
      </SectionTitle>

      <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Reveal className="relative isolate min-h-[26rem] overflow-hidden rounded-card lg:col-span-7 lg:row-span-2">
          <Image
            src="https://picsum.photos/seed/garimpo-rua-comercio/1000/1100"
            alt=""
            fill
            sizes="(min-width: 1024px) 700px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <div className="relative flex h-full min-h-[26rem] flex-col justify-end p-7 text-white md:p-9">
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Busca por nicho e cidade
            </h3>
            <p className="mt-3 max-w-[44ch] leading-relaxed text-white/85">
              Barbearias, clínicas, academias, pet shops. Informe o bairro e o
              raio e receba só empresas em funcionamento, sem repetir as que
              você já viu.
            </p>
          </div>
        </Reveal>

        <Reveal
          className="rounded-card bg-accent-soft p-7 text-accent-ink lg:col-span-5"
        >
          <h3 className="text-xl font-semibold tracking-tight">
            Diagnóstico do site
          </h3>
          <p className="mt-2 leading-relaxed">
            A página inicial é checada de verdade. Quando há dúvida, avisamos
            para você confirmar antes de abordar.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {DIAGNOSIS.map((key) => (
              <Badge
                key={key}
                tone={WEBSITE_STATUS_META[key].tone}
                className="bg-surface"
              >
                {WEBSITE_STATUS_META[key].label}
              </Badge>
            ))}
          </div>
        </Reveal>

        <Reveal
          className="rounded-card border border-line bg-surface p-7 shadow-soft lg:col-span-5"
        >
          <h3 className="text-xl font-semibold tracking-tight">
            Agente de vendas
          </h3>
          <p className="mt-2 leading-relaxed text-muted">
            Cole a resposta do cliente e receba a próxima mensagem, com o
            motivo por trás dela.
          </p>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="rounded-field bg-surface-2 px-4 py-3">
              <dt className="text-xs text-muted">Cliente escreveu</dt>
              <dd className="mt-1">Achei meio caro para o meu tamanho.</dd>
            </div>
            <div className="rounded-field bg-accent-soft px-4 py-3 text-accent-ink">
              <dt className="text-xs opacity-80">Resposta sugerida</dt>
              <dd className="mt-1">
                Faz sentido olhar o custo. Quantos agendamentos por semana
                você perde hoje por não ter uma página para marcar horário?
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal
          className="grid gap-8 rounded-card border border-line bg-surface-2 p-7 md:grid-cols-2 md:p-9 lg:col-span-12"
        >
          <div>
            <h3 className="text-xl font-semibold tracking-tight">
              Mensagem de abertura
            </h3>
            <p className="mt-2 max-w-[46ch] leading-relaxed text-muted">
              Duas versões curtas, com um fato verdadeiro sobre a empresa e uma
              pergunta simples no final. Sem promessa exagerada e sem inventar
              nome de dono.
            </p>
          </div>
          <figure className="rounded-field bg-surface p-5 shadow-soft">
            <blockquote className="leading-relaxed">
              Oi, tudo bem? Vi que a Barbearia Dois Irmãos ainda não tem um
              site para receber agendamentos. Posso te mostrar uma ideia
              simples?
            </blockquote>
            <figcaption className="mt-3 text-xs text-muted">
              Exemplo de mensagem para WhatsApp
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </Section>
  );
}
