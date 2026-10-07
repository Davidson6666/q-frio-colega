"use server";

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { saveProfile } from "@/lib/profile/save";
import { toFieldErrors, type ActionState } from "@/lib/validators";
import { onboardingSchema } from "@/lib/validators/profile";

export async function completeOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const raw = {
    services: formData.getAll("services").map(String),
    city: String(formData.get("city") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error), values: raw };
  }

  const saved = await saveProfile(user.id, {
    services_offered: parsed.data.services,
    default_city: parsed.data.city,
    whatsapp: parsed.data.whatsapp,
  });

  if (!saved) {
    return {
      ok: false,
      error: "Não foi possível salvar agora. Tente novamente em instantes.",
      values: raw,
    };
  }

  redirect("/app");
}
