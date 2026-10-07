import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { siteConfig } from "@/config/site";
import { Container } from "./section";

const LINKS = [
  { href: "/precos", label: "Preços" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos de uso" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-14">
      <Container className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Prospecção para freelancers e pequenas agências que vendem para
            empresas locais.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-3 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="text-muted transition-colors hover:text-foreground"
          >
            {siteConfig.supportEmail}
          </a>
        </nav>
      </Container>
    </footer>
  );
}
