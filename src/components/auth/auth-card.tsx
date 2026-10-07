/** Heading block shared by the auth screens. */
export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-balance text-3xl font-semibold tracking-tighter md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}

/** "or" divider between social and password sign-in. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-4 text-sm text-muted" role="separator">
      <span className="h-px flex-1 bg-line" />
      ou
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
