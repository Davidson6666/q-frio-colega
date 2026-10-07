"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";

/**
 * Mobile navigation as a native popover (top layer, Escape and outside click
 * close it for free). It opens as a panel under the header pill so the
 * hamburger-to-X morph stays visible.
 */
export function MobileMenu() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => panelRef.current?.hidePopover();

  return (
    <div className="md:hidden">
      <button
        type="button"
        popoverTarget="mobile-menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        className="grid size-10 place-items-center rounded-full transition-colors duration-300 hover:bg-surface-2"
      >
        <span className="relative block h-3 w-5" aria-hidden>
          <span
            className={cn(
              "absolute inset-x-0 h-px bg-current transition-transform duration-500 ease-spring",
              open ? "top-1/2 rotate-45" : "top-0",
            )}
          />
          <span
            className={cn(
              "absolute inset-x-0 h-px bg-current transition-transform duration-500 ease-spring",
              open ? "top-1/2 -rotate-45" : "bottom-0",
            )}
          />
        </span>
      </button>

      <div
        id="mobile-menu"
        ref={panelRef}
        popover="auto"
        onToggle={(event) => setOpen(event.newState === "open")}
        className="menu-sheet fixed inset-x-3 top-20 bottom-auto m-0 h-auto w-auto flex-col gap-1 rounded-card border border-line bg-surface p-3 text-foreground shadow-lift [&:popover-open]:flex"
      >
        <nav aria-label="Principal" className="flex flex-col">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="rounded-field px-4 py-3.5 text-base font-medium transition-colors hover:bg-surface-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-2 grid gap-2 border-t border-line pt-3">
          <Link
            href="/login"
            className={buttonVariants({ variant: "secondary", size: "md" })}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            Começar agora
          </Link>
        </div>
      </div>
    </div>
  );
}
