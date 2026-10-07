import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { Pricing } from "@/components/marketing/pricing";

export const metadata: Metadata = {
  title: "Preços",
  description:
    "Compare os planos Free, Pro e King e veja como os créditos de prospecção funcionam.",
};

export default function PricingPage() {
  return (
    <div className="pt-20">
      <Pricing headingAs="h1" />
      <Faq />
    </div>
  );
}
