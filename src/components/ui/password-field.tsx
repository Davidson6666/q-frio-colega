"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { FieldError, fieldId, inputClassName } from "./fields";

/** Password input with an unmask toggle. Pasting is allowed (never block it). */
export function PasswordField({
  name = "password",
  label = "Senha",
  hint,
  error,
  autoComplete,
  minLength,
  maxLength,
}: {
  name?: string;
  label?: string;
  hint?: string;
  error?: string | string[];
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const id = fieldId(name);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = Array.isArray(error) ? error.length > 0 : Boolean(error);

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        <span className="ms-1 text-muted" aria-hidden>
          *
        </span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          aria-invalid={hasError || undefined}
          aria-describedby={cn(hint && hintId, hasError && errorId) || undefined}
          className={cn(inputClassName, "pe-14")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 end-0 grid w-12 place-items-center rounded-e-field text-muted transition-colors hover:text-foreground"
        >
          {visible ? (
            <EyeSlash size={20} weight="light" aria-hidden />
          ) : (
            <Eye size={20} weight="light" aria-hidden />
          )}
        </button>
      </div>
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} error={error} />
    </div>
  );
}
