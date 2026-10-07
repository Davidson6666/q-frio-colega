import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Section, SectionTitle } from "./section";

const QUESTIONS = [
  {
    q: "De onde vêm as empresas?",
    a: "Da busca pública do Google Maps. Mostramos o nome, o endereço, o telefone comercial e o site que a própria empresa cadastrou.",
  },
  {
    q: "A plataforma envia mensagens por mim?",
    a: "Não. Você recebe o texto pronto e abre a conversa pelo seu WhatsApp, revisando antes de enviar. Não existe envio em massa.",
  },
  {
    q: "Como o site de cada empresa é analisado?",
    a: "Fazemos uma checagem automática da página inicial: se abre, se o certificado é válido, se carrega rápido e se funciona no celular. Quando há dúvida, avisamos para você verificar manualmente.",
  },
  {
    q: "Os créditos acumulam de um mês para o outro?",
    a: "Não. Eles renovam a cada mês para o valor do seu plano.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O plano continua ativo até o fim do período pago e depois volta para o Free, sem multa.",
  },
  {
    q: "Preciso saber vender para usar?",
    a: "O agente de vendas sugere a próxima resposta a partir do que o cliente escreveu e explica o porquê. Ele ajuda, mas a conversa continua sendo sua.",
  },
] as const;

/** Native exclusive accordion: <details> sharing a `name` keeps one open at a time. */
export function Faq() {
  return (
    <Section id="faq" labelledBy="faq-titulo">
      <SectionTitle id="faq-titulo">Perguntas frequentes</SectionTitle>

      <div className="mt-12 max-w-3xl">
        {QUESTIONS.map((item, index) => (
          <details
            key={item.q}
            name="faq"
            open={index === 0}
            className="group border-b border-line first:border-t"
          >
            <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-6 py-5 text-lg font-medium tracking-tight">
              {item.q}
              <Plus
                size={22}
                weight="light"
                className="faq-icon shrink-0 text-muted transition-transform duration-500 ease-spring"
                aria-hidden
              />
            </summary>
            <p className="max-w-[62ch] pb-6 leading-relaxed text-muted">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
