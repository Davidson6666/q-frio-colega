"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariants } from "./button";

/**
 * Submit button that locks itself while the form action runs (prevents double
 * posts). It is never disabled beforehand, so users can always submit and see
 * validation feedback.
 */
export function SubmitButton({
  children,
  pendingLabel = "Enviando…",
  variant,
  size,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
} & ButtonVariants) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
