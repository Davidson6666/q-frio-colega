import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}
      {...props}
    />
  );
}

export function Section({
  id,
  className,
  children,
  labelledBy,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("py-24 md:py-32", className)}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Small pill label above a section title. Use sparingly (max 1 per 3 sections). */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
      {children}
    </span>
  );
}

export function SectionTitle({
  id,
  as: Tag = "h2",
  children,
  className,
}: {
  id?: string;
  as?: "h1" | "h2";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "text-balance text-3xl font-semibold leading-[1.08] tracking-tighter md:text-5xl",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
