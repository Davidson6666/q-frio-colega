import type { Metadata } from "next";
import { ProfileForm } from "@/components/app/profile-form";
import { siteConfig } from "@/config/site";
import { getProfile, getUser } from "@/lib/auth/session";
import { formatBrazilPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!profile) return null; // The layout already redirects when there is no profile.

  return (
    <div className="grid max-w-2xl gap-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tighter md:text-4xl">
          Perfil
        </h1>
        <p className="mt-2 text-muted">
          Esses dados personalizam as buscas e as mensagens que você gera.
        </p>
      </header>

      <ProfileForm
        initial={{
          name: profile.name ?? "",
          services: profile.services_offered,
          city: profile.default_city ?? "",
          whatsapp: formatBrazilPhone(profile.whatsapp),
        }}
      />

      <section aria-labelledby="conta" className="border-t border-line pt-8">
        <h2 id="conta" className="text-xl font-semibold tracking-tight">
          Conta
        </h2>
        <dl className="mt-4 grid gap-4 text-sm">
          <div>
            <dt className="text-muted">E-mail</dt>
            <dd className="mt-1 font-medium">{user?.email}</dd>
          </div>
        </dl>
        <p className="mt-6 max-w-[60ch] text-sm leading-relaxed text-muted">
          Para excluir sua conta e todos os seus dados, escreva para{" "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
