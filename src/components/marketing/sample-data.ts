import type { OpportunityCardData } from "@/components/app/opportunity-card";

/**
 * Illustrative data for the landing page. Business names are fictional and the
 * page labels these results as examples.
 */
export const SAMPLE_BUSINESSES: OpportunityCardData[] = [
  {
    name: "Barbearia Dois Irmãos",
    address: "Rua Brasil, 412, Centro",
    rating: 4.8,
    reviewsCount: 212,
    websiteStatus: "NO_WEBSITE",
    score: 86,
    suggestedOffer: "Site com agendamento online",
  },
  {
    name: "Clínica Sorrir Mais",
    address: "Rua das Palmeiras, 85",
    rating: 4.6,
    reviewsCount: 87,
    websiteStatus: "BROKEN",
    score: 78,
    suggestedOffer: "Site novo e perfil no Google atualizado",
  },
  {
    name: "Pet Shop Cantinho Feliz",
    address: "Rua Santos Dumont, 230",
    rating: 4.3,
    reviewsCount: 41,
    websiteStatus: "SOCIAL_ONLY",
    score: 64,
    suggestedOffer: "Página de captação com botão de WhatsApp",
  },
];
