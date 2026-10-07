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
  // bcrypt only uses the first 72 BYTES. Count bytes, not characters, so accents
  // and emoji cannot push a password past the limit and get silently truncated.
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .refine((value) => new TextEncoder().encode(value).length <= 72, {
      message: "A senha é longa demais. Use até 72 caracteres comuns (acentos e símbolos contam mais).",
    }),
  terms: z.literal("on", "Aceite os termos para criar a conta."),
  // Honeypot: real users never fill this hidden field.
  company: z.string().max(0).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
