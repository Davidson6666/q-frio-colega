import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/** Form-level feedback region. Always rendered so screen readers announce changes. */
export function FormAlert({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  const text = error ?? message;
  const isError = Boolean(error);

  return (
    <div role={isError ? "alert" : "status"} aria-live="polite">
      {text ? (
        <p
          className={cn(
            "flex items-start gap-2.5 rounded-field px-4 py-3 text-sm",
            isError ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent-ink",
          )}
        >
          {isError ? (
            <WarningCircle size={20} weight="fill" className="mt-px shrink-0" aria-hidden />
          ) : (
            <CheckCircle size={20} weight="fill" className="mt-px shrink-0" aria-hidden />
          )}
          <span>{text}</span>
        </p>
      ) : null}
    </div>
  );
}
