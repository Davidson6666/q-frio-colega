import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth";
import { onboardingSchema, profileSchema } from "./profile";
import { toFieldErrors } from "./index";

describe("loginSchema", () => {
  it("normalizes the e-mail", () => {
    const result = loginSchema.parse({ email: "  Ana@Exemplo.COM ", password: "x" });
    expect(result.email).toBe("ana@exemplo.com");
  });

  it("rejects invalid e-mail and empty password", () => {
    const result = loginSchema.safeParse({ email: "nao-e-email", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = toFieldErrors(result.error);
      expect(errors.email?.[0]).toBe("Informe um e-mail válido.");
      expect(errors.password?.[0]).toBe("Informe sua senha.");
    }
  });
});

describe("signupSchema", () => {
  const valid = {
    name: "Ana Souza",
    email: "ana@exemplo.com",
    password: "senhaforte123",
    terms: "on",
  };

  it("accepts a valid signup", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the terms checkbox", () => {
    const result = signupSchema.safeParse({ ...valid, terms: "" });
    expect(result.success).toBe(false);
  });

  it("enforces password length between 8 and 72", () => {
    expect(signupSchema.safeParse({ ...valid, password: "curta" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "a".repeat(73) }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "a".repeat(72) }).success).toBe(true);
  });

  it("measures the password limit in bytes, not characters", () => {
    // 40 accented letters = 40 characters but 80 bytes, past bcrypt's 72-byte limit.
    expect(signupSchema.safeParse({ ...valid, password: "á".repeat(40) }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "á".repeat(36) }).success).toBe(true);
  });

  it("rejects a filled honeypot", () => {
    expect(signupSchema.safeParse({ ...valid, company: "spam" }).success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  it("accepts services, city and an empty whatsapp as null", () => {
    const result = onboardingSchema.parse({
      services: ["site", "design"],
      city: " Campo Mourão ",
      whatsapp: "",
    });
    expect(result.city).toBe("Campo Mourão");
    expect(result.whatsapp).toBeNull();
  });

  it("normalizes a filled whatsapp", () => {
    const result = onboardingSchema.parse({
      services: ["site"],
      city: "Maringá",
      whatsapp: "(44) 99999-8888",
    });
    expect(result.whatsapp).toBe("5544999998888");
  });

  it("rejects an invalid whatsapp with a helpful message", () => {
    const result = onboardingSchema.safeParse({
      services: ["site"],
      city: "Maringá",
      whatsapp: "123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).whatsapp?.[0]).toContain("WhatsApp inválido");
    }
  });

  it("requires at least one known service", () => {
    expect(onboardingSchema.safeParse({ services: [], city: "Maringá" }).success).toBe(false);
    expect(
      onboardingSchema.safeParse({ services: ["hackear"], city: "Maringá" }).success,
    ).toBe(false);
  });

  it("requires a city", () => {
    expect(onboardingSchema.safeParse({ services: ["site"], city: " " }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("also requires a name", () => {
    const result = profileSchema.safeParse({
      services: ["site"],
      city: "Maringá",
      whatsapp: "",
      name: "",
    });
    expect(result.success).toBe(false);
  });
});
