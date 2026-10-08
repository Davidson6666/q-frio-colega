import { Suspense } from "react";
import { connection } from "next/server";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { logout } from "@/app/entrar/actions";
import { SearchTool } from "@/components/search/search-tool";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getProvider } from "@/lib/places/provider-config";

export default function HomePage() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="gap-2">
                <SignOut size={18} weight="regular" aria-hidden />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 md:py-14">
        <h1 className="max-w-[24ch] text-balance text-3xl font-semibold leading-[1.08] tracking-tighter md:text-5xl">
          Lojas sem site ou com site quebrado.
        </h1>
        <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-muted">
          Escolha o estado, a cidade e o tipo de loja. Veja quem não tem site, quem só tem rede
          social e quem tem um site com problema.
        </p>
        <div className="mt-10">
          <Suspense fallback={<Skeleton className="h-52 rounded-card" />}>
            <Tool />
          </Suspense>
        </div>
      </main>
    </>
  );
}

/** The data source is a server setting read per request, not baked in at build time. */
async function Tool() {
  await connection();
  return <SearchTool source={getProvider()} />;
}
