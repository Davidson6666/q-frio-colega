import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-md">
        <p className="font-mono text-sm text-muted">Erro 404</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tighter">
          Essa página não existe.
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          O endereço pode ter mudado ou ter sido digitado errado.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-8" })}>
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
