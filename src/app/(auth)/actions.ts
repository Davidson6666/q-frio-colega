"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthBaseUrl } from "@/config/site";
import { AUTH_NEXT_COOKIE } from "@/lib/auth/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validators/auth";
import { formString, toFieldErrors, type ActionState } from "@/lib/validators";
import { safeNextPath } from "@/lib/utils";

const NOT_CONFIGURED: ActionState = {
  ok: false,
  error:
    "O Supabase ainda não foi configurado neste ambiente. Veja o passo a passo no README.",
};

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const raw = {
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      values: { email: raw.email },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Same message for wrong password and unknown e-mail: do not reveal which exist.
    const message =
      error.code === "email_not_confirmed"
        ? "Confirme seu e-mail antes de entrar. O link foi enviado para a sua caixa de entrada."
        : "E-mail ou senha incorretos.";
    return { ok: false, error: message, values: { email: raw.email } };
  }

  redirect(safeNextPath(formString(formData, "next")));
}

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const raw = {
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    terms: formString(formData, "terms"),
    company: formString(formData, "company"),
  };

  // Honeypot filled: a bot. Answer as if it worked, create nothing.
  if (raw.company) {
    return { ok: true, message: "Enviamos um link de confirmação para o seu e-mail." };
  }

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error),
      values: { name: raw.name, email: raw.email },
    };
  }

  const { name, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      // No query string: it must match Supabase's redirect allow-list exactly.
      // New accounts reach onboarding through the AuthGate in /app.
      emailRedirectTo: `${getAuthBaseUrl()}/auth/callback`,
    },
  });

  if (error) {
    const message =
      error.code === "weak_password"
        ? "Essa senha é fraca demais. Use pelo menos 8 caracteres, misturando letras e números."
        : error.code === "user_already_exists"
          ? "Não foi possível criar a conta com esses dados. Se você já tem uma conta, entre com ela."
          : "Não foi possível criar a conta agora. Tente novamente em instantes.";
    return { ok: false, error: message, values: { name, email } };
  }

  // Email confirmation disabled: a session already exists.
  if (data.session) redirect("/onboarding");

  return {
    ok: true,
    message: `Enviamos um link de confirmação para ${email}. Abra o e-mail para ativar a conta.`,
  };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/login?erro=config");

  // Remember the destination in a short-lived cookie instead of the callback
  // URL, which has to match the Supabase allow-list without a query string.
  const cookieStore = await cookies();
  cookieStore.set(AUTH_NEXT_COOKIE, safeNextPath(formString(formData, "next")), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${getAuthBaseUrl()}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?erro=oauth");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
