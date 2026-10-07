"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAV } from "./nav-items";

export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal">
      <ul className="grid gap-1">
        {APP_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const base =
            "flex min-h-11 items-center gap-3 rounded-field px-3.5 text-sm font-medium";

          if (!item.ready) {
            return (
              <li key={item.href}>
                <span
                  aria-disabled="true"
                  className={cn(base, "cursor-not-allowed text-muted/70")}
                >
                  <Icon size={20} weight="light" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-normal">
                    Em breve
                  </span>
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  base,
                  "transition-colors duration-300",
                  active
                    ? "bg-accent-soft text-accent-ink"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon size={20} weight={active ? "regular" : "light"} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
