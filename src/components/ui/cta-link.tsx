import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariants } from "./button";

/**
 * Primary call to action with the trailing arrow nested in its own circle
 * ("button-in-button"). The circle drifts on hover for a bit of internal tension.
 */
export function CtaLink({
  href,
  children,
  variant = "primary",
  size = "lg",
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & ButtonVariants) {
  const onAccent = variant === "primary";
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant, size }),
        "group ps-7 pe-2",
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "grid size-10 place-items-center rounded-full transition-transform duration-500 ease-spring",
          "group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
          onAccent ? "bg-accent-foreground/15" : "bg-foreground/10",
        )}
      >
        <ArrowRight size={18} weight="regular" aria-hidden />
      </span>
    </Link>
  );
}
