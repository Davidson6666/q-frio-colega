import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <LegalPlaceholder
      title="Termos de uso"
      summary="A plataforma entrega análises e textos prontos. O contato com cada empresa é feito por você, que é responsável pela abordagem e deve respeitar quem pedir para não ser contatado."
    />
  );
}
