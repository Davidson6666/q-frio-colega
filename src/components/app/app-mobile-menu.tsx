"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AppNav } from "./app-nav";

/** Native popover panel under the top bar; same pattern as the marketing menu. */
export function AppMobileMenu({ children }: { children?: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        popoverTarget="app-menu"
        aria-expanded={open}
        aria-controls="app-menu"
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
        id="app-menu"
        ref={panelRef}
        popover="auto"
        onToggle={(event) => setOpen(event.newState === "open")}
        className="menu-sheet fixed inset-x-3 top-[4.25rem] bottom-auto m-0 h-auto w-auto flex-col gap-3 rounded-card border border-line bg-surface p-3 text-foreground shadow-lift [&:popover-open]:flex"
      >
        <AppNav onNavigate={() => panelRef.current?.hidePopover()} />
        {children}
      </div>
    </div>
  );
}
