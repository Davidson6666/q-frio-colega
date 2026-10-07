import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Logo href="/entrar" />
        <ThemeToggle />
      </div>
      <main id="conteudo" className="flex flex-1 items-center py-12">
        <div className="mx-auto grid w-full max-w-sm gap-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tighter">Entrar</h1>
            <p className="mt-3 leading-relaxed text-muted">
              Acesso restrito. Digite a senha para usar a ferramenta.
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
