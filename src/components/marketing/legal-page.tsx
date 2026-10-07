import { Container } from "./section";

/**
 * Placeholder for legal pages. The real text is a Phase 8 deliverable and must
 * be reviewed by a lawyer before launch.
 */
export function LegalPlaceholder({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  return (
    <Container className="max-w-3xl py-32">
      <h1 className="text-balance text-4xl font-semibold tracking-tighter md:text-5xl">
        {title}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted">{summary}</p>
      <p className="mt-6 rounded-field bg-warn-soft px-4 py-3 text-sm text-warn">
        Versão provisória de desenvolvimento. O texto completo será publicado
        antes do lançamento.
      </p>
    </Container>
  );
}
