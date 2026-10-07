"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { saveProfile } from "@/lib/profile/save";
import { formString, formStrings, toFieldErrors, type ActionState } from "@/lib/validators";
import { profileSchema } from "@/lib/validators/profile";

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const raw = {
    name: formString(formData, "name"),
    services: formStrings(formData, "services"),
    city: formString(formData, "city"),
    whatsapp: formString(formData, "whatsapp"),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error), values: raw };
  }

  const saved = await saveProfile(user.id, {
    name: parsed.data.name,
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

  revalidatePath("/app", "layout");
  return { ok: true, message: "Perfil atualizado.", values: raw };
}
