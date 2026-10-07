"use client";

import { useActionState } from "react";
import { login } from "@/app/entrar/actions";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form";
import { useFocusFirstError } from "@/lib/hooks/use-focus-first-error";

export function LoginForm() {
  const [state, action] = useActionState(login, initialActionState);
  const formRef = useFocusFirstError(state);

  return (
    <form ref={formRef} action={action} className="grid gap-5" noValidate>
      <PasswordField autoComplete="current-password" error={state.error} />
      <SubmitButton size="lg" pendingLabel="Entrando…" className="w-full">
        Entrar
      </SubmitButton>
    </form>
  );
}
