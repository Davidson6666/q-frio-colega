"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  accessState,
  passwordMatches,
  sessionToken,
} from "@/lib/access";
import { formString, type ActionState } from "@/lib/form";
import { createRateLimiter } from "@/lib/rate-limit";

// Only WRONG passwords count. Per client address, plus a global ceiling: the
// forwarded-for header is only trustworthy behind a proxy that overwrites it, so
// the per-client limit alone could be sidestepped by spoofing it.
const WINDOW_MS = 15 * 60 * 1000;
const perClient = createRateLimiter({ limit: 5, windowMs: WINDOW_MS });
const overall = createRateLimiter({ limit: 30, windowMs: WINDOW_MS });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (accessState(undefined) === "misconfigured") {
    return { error: "APP_PASSWORD e SESSION_SECRET precisam estar configuradas no servidor." };
  }

  const headerList = await headers();
  const client = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const clientState = perClient.peek(client);
  const overallState = overall.peek("all");
  if (!clientState.allowed || !overallState.allowed) {
    const wait = Math.max(clientState.retryAfterMs, overallState.retryAfterMs);
    return { error: `Muitas tentativas erradas. Tente de novo em ${Math.ceil(wait / 60000)} min.` };
  }

  // A short fixed delay makes guessing slow even before the limiter kicks in.
  await sleep(400);

  if (!passwordMatches(formString(formData, "password"))) {
    perClient.hit(client);
    overall.hit("all");
    return { error: "Senha incorreta." };
  }
  perClient.reset(client);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/entrar");
}
