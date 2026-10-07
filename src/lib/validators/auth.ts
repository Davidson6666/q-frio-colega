import { z } from "zod";
import { nameField } from "./profile";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido."));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Informe sua senha."),
});

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  // 72 is bcrypt's byte limit; anything longer is silently truncated by the provider.
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha pode ter no máximo 72 caracteres."),
  terms: z.literal("on", "Aceite os termos para criar a conta."),
  // Honeypot: real users never fill this hidden field.
  company: z.string().max(0).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
