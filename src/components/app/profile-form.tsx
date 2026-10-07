"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/app/perfil/actions";
import { ChipCheckbox, FieldError, TextField } from "@/components/ui/fields";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { SERVICES } from "@/config/services";
import { useFocusFirstError } from "@/lib/hooks/use-focus-first-error";
import { initialActionState } from "@/lib/validators";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; services: string[]; city: string; whatsapp: string };
}) {
  const [state, action] = useActionState(updateProfile, initialActionState);
  const formRef = useFocusFirstError(state);

  const values = state.values;
  const services = (values?.services as string[] | undefined) ?? initial.services;

  return (
    <form ref={formRef} action={action} className="grid gap-8" noValidate>
      <FormAlert error={state.error} message={state.ok ? state.message : undefined} />

      <TextField
        name="name"
        label="Nome"
        autoComplete="name"
        required
        defaultValue={(values?.name as string | undefined) ?? initial.name}
        error={state.fieldErrors?.name}
      />

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">O que você vende</legend>
        <div className="flex flex-wrap gap-2.5">
          {SERVICES.map((service) => (
            <ChipCheckbox
              key={service.id}
              name="services"
              value={service.id}
              label={service.label}
              defaultChecked={services.includes(service.id)}
            />
          ))}
        </div>
        <FieldError id="field-services-error" error={state.fieldErrors?.services} />
      </fieldset>

      <div className="grid gap-8 sm:grid-cols-2">
        <TextField
          name="city"
          label="Cidade principal"
          autoComplete="address-level2"
          required
          defaultValue={(values?.city as string | undefined) ?? initial.city}
          error={state.fieldErrors?.city}
        />
        <TextField
          name="whatsapp"
          label="WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          defaultValue={(values?.whatsapp as string | undefined) ?? initial.whatsapp}
          hint="Usado no botão de contato do seu portfólio."
          error={state.fieldErrors?.whatsapp}
        />
      </div>

      <div>
        <SubmitButton size="lg" pendingLabel="Salvando…">
          Salvar alterações
        </SubmitButton>
      </div>
    </form>
  );
}
