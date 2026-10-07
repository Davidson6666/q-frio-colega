import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPlaceholder
      title="Política de privacidade"
      summary="Coletamos apenas dados públicos de empresas (nome, endereço, telefone comercial e site) e os dados da sua conta. Você pode pedir a exclusão da conta e dos seus dados a qualquer momento."
    />
  );
}
