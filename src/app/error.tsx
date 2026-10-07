"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-md" role="alert">
        <h1 className="text-balance text-4xl font-semibold tracking-tighter">
          Algo deu errado.
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Não conseguimos carregar esta página. Tente de novo; se o problema
          continuar, volte mais tarde.
        </p>
        <Button className="mt-8" onClick={reset}>
          Tentar de novo
        </Button>
      </div>
    </main>
  );
}
