import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { NAV_LINKS } from "./nav-links";

/**
 * Floating glass pill. Backdrop blur is fine here because the element is fixed,
 * not part of a scrolling container. One line at every desktop width, 56px tall.
 */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-3 z-40 px-3">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 rounded-full border border-line bg-surface/80 ps-5 pe-2 shadow-soft backdrop-blur-xl">
        <Logo />

        <nav aria-label="Principal" className="hidden items-center md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors duration-300 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/login"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "hidden md:inline-flex",
            })}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={buttonVariants({
              variant: "primary",
              size: "sm",
              className: "hidden md:inline-flex",
            })}
          >
            Começar agora
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
