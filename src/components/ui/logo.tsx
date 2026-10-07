import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-full", className)}
      aria-label={`${siteConfig.name}, página inicial`}
    >
      <span className="grid size-8 place-items-center rounded-[0.6rem] bg-accent text-accent-foreground">
        <Compass size={18} weight="bold" aria-hidden />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        {siteConfig.name}
      </span>
    </Link>
  );
}
