"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/app/(auth)/actions";
import { FormAlert } from "@/components/ui/form-alert";
import { TextField } from "@/components/ui/fields";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useFocusFirstError } from "@/lib/hooks/use-focus-first-error";
import { initialActionState } from "@/lib/validators";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action] = useActionState(signIn, initialActionState);
  const formRef = useFocusFirstError(state);

  return (
    <form ref={formRef} action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      <FormAlert error={state.error ?? notice} />

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
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />

      <SubmitButton size="lg" pendingLabel="Entrando…" className="mt-1 w-full">
        Entrar
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
