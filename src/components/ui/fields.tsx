import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/** Shared look for text-like inputs. 16px font avoids iOS zoom; 48px height is a safe tap target. */
export const inputClassName = cn(
  "h-12 w-full rounded-field border border-field bg-surface px-4 text-base text-foreground",
  "transition-colors duration-300 ease-spring",
  "hover:border-foreground/50 aria-[invalid=true]:border-danger",
  "disabled:opacity-60",
);

type ErrorValue = string | string[] | undefined;

function firstError(error: ErrorValue): string | undefined {
  return Array.isArray(error) ? error[0] : error;
}

export function fieldId(name: string) {
  return `field-${name}`;
}

/** Inline error: icon + text, so state is never conveyed by color alone. */
export function FieldError({ id, error }: { id: string; error: ErrorValue }) {
  const message = firstError(error);
  return (
    <p
      id={id}
      aria-live="polite"
      className={cn("flex items-start gap-1.5 text-sm text-danger", !message && "hidden")}
    >
      {message ? (
        <>
          <WarningCircle size={18} weight="fill" className="mt-px shrink-0" aria-hidden />
          <span>{message}</span>
        </>
      ) : null}
    </p>
  );
}
