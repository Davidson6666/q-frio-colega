"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/app/(auth)/actions";
import { FieldError, TextField } from "@/components/ui/fields";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFocusFirstError } from "@/lib/hooks/use-focus-first-error";
import { initialActionState } from "@/lib/validators";

export function SignupForm() {
  const [state, action] = useActionState(signUp, initialActionState);
  const formRef = useFocusFirstError(state);

  // Account created, waiting for e-mail confirmation: replace the form.
  if (state.ok && state.message) {
    return (
      <div className="grid gap-5">
        <FormAlert message={state.message} />
        <p className="text-sm leading-relaxed text-muted">
          Não recebeu? Confira a caixa de spam. Depois de confirmar, é só entrar
          e responder três perguntas rápidas.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-foreground underline underline-offset-4"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="grid gap-5" noValidate>
      <FormAlert error={state.error} />

      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Empresa
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <TextField
        name="name"
        label="Nome"
        autoComplete="name"
        required
        defaultValue={state.values?.name as string | undefined}
        error={state.fieldErrors?.name}
      />

      <TextField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="username"
        inputMode="email"
        spellCheck={false}
        autoCapitalize="none"
        required
        defaultValue={state.values?.email as string | undefined}
        error={state.fieldErrors?.email}
      />

      <PasswordField
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        hint="Pelo menos 8 caracteres."
        error={state.fieldErrors?.password}
      />

      <div className="grid gap-1.5">
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            name="terms"
            required
            aria-invalid={state.fieldErrors?.terms ? true : undefined}
            aria-describedby={state.fieldErrors?.terms ? "field-terms-error" : undefined}
            className="mt-0.5 size-5 shrink-0 rounded-md"
          />
          <span>
            Li e aceito os{" "}
            <Link
              href="/termos"
              target="_blank"
              className="font-medium underline underline-offset-4"
            >
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="font-medium underline underline-offset-4"
            >
              Política de privacidade
            </Link>
            .
          </span>
        </label>
        <FieldError id="field-terms-error" error={state.fieldErrors?.terms} />
      </div>

      <SubmitButton size="lg" pendingLabel="Criando conta…" className="mt-1 w-full">
        Criar conta
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
