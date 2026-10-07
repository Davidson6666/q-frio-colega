import { z } from "zod";
import { SERVICE_IDS } from "@/config/services";
import { normalizeBrazilPhone } from "@/lib/phone";

export const nameField = z
  .string()
  .trim()
  .min(2, "Informe seu nome.")
  .max(80, "O nome pode ter no máximo 80 caracteres.");

export const servicesField = z
  .array(z.enum(SERVICE_IDS))
  .min(1, "Escolha ao menos um serviço.")
  .max(SERVICE_IDS.length);

export const cityField = z
  .string()
  .trim()
  .min(2, "Informe sua cidade.")
  .max(80, "O nome da cidade pode ter no máximo 80 caracteres.");

/** Optional field: empty becomes null, filled must be a valid BR phone. */
export const whatsappField = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const normalized = normalizeBrazilPhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "WhatsApp inválido. Use DDD + número, por exemplo (44) 99999-8888.",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const onboardingSchema = z.object({
  services: servicesField,
  city: cityField,
  whatsapp: whatsappField,
});

export const profileSchema = onboardingSchema.extend({
  name: nameField,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
