import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Split layout: form on one side, an image panel on the other (hidden on small
 * screens, where the form takes the whole viewport).
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <main id="conteudo" className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>
      </div>

      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://picsum.photos/seed/garimpo-cidade-comercio/1000/1400"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <p className="max-w-[18ch] text-balance text-4xl font-semibold leading-[1.08] tracking-tighter">
            Quem vende bem começa sabendo a quem vender.
          </p>
          <p className="mt-5 max-w-[40ch] leading-relaxed text-white/80">
            Empresas reais, diagnóstico claro e uma mensagem pronta para abrir
            a conversa.
          </p>
        </div>
      </aside>
    </div>
  );
}
