import type { Metadata } from "next";
import { AuthHeading, OrDivider } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <div className="grid gap-8">
      <AuthHeading
        title="Criar conta"
        subtitle="Leva menos de um minuto. Depois, três perguntas rápidas para personalizar a busca."
      />
      <div className="grid gap-6">
        <GoogleButton next="/onboarding" />
        <OrDivider />
        <SignupForm />
      </div>
    </div>
  );
}
