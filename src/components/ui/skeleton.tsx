import { cn } from "@/lib/utils";

/** Loading placeholder. Always shape it like the content it stands in for. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-field bg-surface-2 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
