/**
 * Fonte unica de verdade para planos, creditos e limites.
 * Ajuste os valores aqui; nenhum outro arquivo deve hardcodar preco ou limite.
 */

export const PLAN_IDS = ["free", "pro", "king"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PortfolioTemplateAccess = "basic" | "all";

export interface PlanConfig {
  id: PlanId;
  name: string;
  /** Preco mensal em centavos de real. 0 = gratuito. */
  priceCents: number;
  /** Creditos concedidos a cada renovacao. Nao acumulam entre meses. */
  monthlyCredits: number;
  /** Maximo de empresas por busca. 0 = prospeccao bloqueada. */
  leadsPerSearch: number;
  features: {
    prospecting: boolean;
    basicAnalysis: boolean;
    deepAnalysis: boolean;
    salesAgent: boolean;
    /** Mensagens do agente sem custo de credito. */
    unlimitedAgent: boolean;
    conversationHistory: boolean;
  };
  portfolio: {
    /** null = ilimitado */
    maxProjects: number | null;
    templates: PortfolioTemplateAccess;
    platformBadge: boolean;
  };
  /** Frases curtas exibidas na pagina de precos. */
  highlights: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    monthlyCredits: 0,
    leadsPerSearch: 0,
    features: {
      prospecting: false,
      basicAnalysis: false,
      deepAnalysis: false,
      salesAgent: false,
      unlimitedAgent: false,
      conversationHistory: false,
    },
    portfolio: { maxProjects: 3, templates: "basic", platformBadge: true },
    highlights: [
      "Portfólio público com até 3 projetos",
      "Template básico",
      "Assinatura da plataforma no rodapé",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 3990,
    monthlyCredits: 300,
    leadsPerSearch: 30,
    features: {
      prospecting: true,
      basicAnalysis: true,
      deepAnalysis: true,
      salesAgent: true,
      unlimitedAgent: false,
      conversationHistory: true,
    },
    portfolio: { maxProjects: 10, templates: "all", platformBadge: false },
    highlights: [
      "300 créditos por mês",
      "Até 30 empresas por busca",
      "Análise profunda e estratégia de abordagem",
      "Agente de vendas e histórico de conversas",
      "Portfólio com até 10 projetos, todos os templates, sem marca",
    ],
  },
  king: {
    id: "king",
    name: "King",
    priceCents: 6499,
    monthlyCredits: 700,
    leadsPerSearch: 50,
    features: {
      prospecting: true,
      basicAnalysis: true,
      deepAnalysis: true,
      salesAgent: true,
      unlimitedAgent: true,
      conversationHistory: true,
    },
    portfolio: { maxProjects: null, templates: "all", platformBadge: false },
    highlights: [
      "700 créditos por mês",
      "Até 50 empresas por busca",
      "Agente de vendas ilimitado",
      "Projetos ilimitados no portfólio",
      "Tudo do plano Pro",
    ],
  },
};

/** Custo em creditos de cada operacao. */
export const CREDIT_COSTS = {
  /** Por empresa entregue na busca (a analise basica ja vem incluida). */
  searchPerBusiness: 1,
  deepAnalysis: 3,
  openingMessage: 1,
  /** Por mensagem do agente. No plano King o custo e zerado. */
  agentMessage: 1,
} as const;

/** Teto de seguranca de mensagens do agente por usuario/dia (plano ilimitado). */
export const AGENT_DAILY_SAFETY_LIMIT = 200;

export function isPlanId(id: unknown): id is PlanId {
  return typeof id === "string" && (PLAN_IDS as readonly string[]).includes(id);
}

export function getPlan(id: string | null | undefined): PlanConfig {
  return PLANS[isPlanId(id) ? id : "free"];
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
