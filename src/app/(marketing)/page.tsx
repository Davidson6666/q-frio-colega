import { FeaturesBento } from "@/components/marketing/features-bento";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PortfolioShowcase } from "@/components/marketing/portfolio-showcase";
import { Pricing } from "@/components/marketing/pricing";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeaturesBento />
      <PortfolioShowcase />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
