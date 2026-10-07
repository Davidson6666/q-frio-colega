import { cn } from "@/lib/utils";

/**
 * Fades its children in as they scroll into view (hierarchy: reading order).
 * Pure CSS (see `.reveal` in globals.css), so it ships no JavaScript and the
 * content is visible by default when scroll-driven animations are unsupported.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  return <Tag className={cn("reveal", className)}>{children}</Tag>;
}
