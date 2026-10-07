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

interface TextFieldProps extends Omit<React.ComponentProps<"input">, "id" | "name"> {
  name: string;
  label: string;
  hint?: string;
  error?: ErrorValue;
}

/** Label above, optional hint, error below. Label spacing < group spacing (proximity). */
export function TextField({
  name,
  label,
  hint,
  error,
  required,
  className,
  ...props
}: TextFieldProps) {
  const id = fieldId(name);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = Boolean(firstError(error));

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="ms-1 text-muted" aria-hidden>
            *
          </span>
        ) : (
          <span className="ms-1.5 text-sm font-normal text-muted">(opcional)</span>
        )}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={cn(hint && hintId, hasError && errorId) || undefined}
        className={cn(inputClassName, className)}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} error={error} />
    </div>
  );
}

/**
 * Multi-select chip. A real checkbox (visually hidden) drives the style, so it
 * works without JavaScript and stays keyboard and screen-reader friendly.
 */
export function ChipCheckbox({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="relative cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="visually-hidden peer"
      />
      <span
        className={cn(
          "inline-flex min-h-11 items-center rounded-full border border-field bg-surface px-4 text-sm font-medium",
          "transition-[background-color,border-color,color,transform] duration-300 ease-spring",
          "hover:bg-surface-2 active:scale-[0.98]",
          "peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-ink",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
        )}
      >
        {label}
      </span>
    </label>
  );
}
