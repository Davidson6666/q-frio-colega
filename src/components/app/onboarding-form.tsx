"use client";

import { useActionState, useRef, useState } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { ChipCheckbox, FieldError, TextField } from "@/components/ui/fields";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { SERVICES } from "@/config/services";
import { initialActionState } from "@/lib/validators";

const TOTAL_STEPS = 3;

export function OnboardingForm({
  initialServices,
  initialCity,
}: {
  initialServices: string[];
  initialCity: string;
}) {
  const [state, action] = useActionState(completeOnboarding, initialActionState);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  const selectedServices = (state.values?.services as string[] | undefined) ?? initialServices;
  const city = (state.values?.city as string | undefined) ?? initialCity;
  const whatsapp = state.values?.whatsapp as string | undefined;

  function goTo(target: number) {
    setStep(target);
    setStepError(undefined);
    // Move focus to the first field of the new step (keyboard and screen readers).
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>(`[data-step="${target}"] input[type="text"], [data-step="${target}"] input[type="tel"]`)
        ?.focus();
    });
  }

  function next() {
    const data = new FormData(formRef.current!);
    if (step === 0 && data.getAll("services").length === 0) {
      setStepError("Escolha ao menos um serviço.");
      return;
    }
    if (step === 1 && String(data.get("city") ?? "").trim().length < 2) {
      setStepError("Informe sua cidade.");
      return;
    }
    goTo(step + 1);
  }

  // Enter must advance the wizard, never submit it half-filled.
  function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || step >= TOTAL_STEPS - 1) return;
    if (event.target instanceof HTMLInputElement && event.target.type !== "checkbox") {
      event.preventDefault();
      next();
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      onKeyDown={onKeyDown}
      className="grid gap-8"
      noValidate
    >
      <div>
        <div className="flex gap-2" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ease-spring ${
                i <= step ? "bg-accent" : "bg-line"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted" aria-live="polite">
          Pergunta {step + 1} de {TOTAL_STEPS}
        </p>
      </div>

      <FormAlert error={state.error ?? stepError} />

      <div data-step="0" hidden={step !== 0} className={step === 0 ? "rise" : undefined}>
        <fieldset className="grid gap-4">
          <legend className="text-3xl font-semibold tracking-tighter">
            O que você vende?
          </legend>
          <p className="text-muted">Escolha um ou mais. Dá para mudar depois.</p>
          <div className="flex flex-wrap gap-2.5">
            {SERVICES.map((service) => (
              <ChipCheckbox
                key={service.id}
                name="services"
                value={service.id}
                label={service.label}
                defaultChecked={selectedServices.includes(service.id)}
              />
            ))}
          </div>
          <FieldError id="field-services-error" error={state.fieldErrors?.services} />
        </fieldset>
      </div>

      <div data-step="1" hidden={step !== 1} className={step === 1 ? "rise" : undefined}>
        <div className="grid gap-4">
          <h2 className="text-3xl font-semibold tracking-tighter">
            Em qual cidade você quer vender?
          </h2>
          <TextField
            name="city"
            label="Cidade"
            autoComplete="address-level2"
            defaultValue={city}
            hint="Você pode trocar a cidade a cada busca."
            error={state.fieldErrors?.city}
            required
          />
        </div>
      </div>

      <div data-step="2" hidden={step !== 2} className={step === 2 ? "rise" : undefined}>
        <div className="grid gap-4">
          <h2 className="text-3xl font-semibold tracking-tighter">
            Qual é o seu WhatsApp?
          </h2>
          <TextField
            name="whatsapp"
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            defaultValue={whatsapp}
            hint="Entra no botão de contato do seu portfólio. Pode deixar em branco."
            error={state.fieldErrors?.whatsapp}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {step > 0 ? (
          <Button variant="secondary" size="lg" onClick={() => goTo(step - 1)}>
            Voltar
          </Button>
        ) : null}
        {step < TOTAL_STEPS - 1 ? (
          <Button size="lg" className="flex-1" onClick={next}>
            Continuar
          </Button>
        ) : (
          <SubmitButton size="lg" pendingLabel="Salvando..." className="flex-1">
            Concluir
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
