import { describe, expect, it } from "vitest";
import { formatBrazilPhone, normalizeBrazilPhone, whatsappUrl } from "./phone";

describe("normalizeBrazilPhone", () => {
  it("normalizes a formatted mobile number", () => {
    expect(normalizeBrazilPhone("(44) 99999-8888")).toBe("5544999998888");
  });

  it("accepts an existing country code and symbols", () => {
    expect(normalizeBrazilPhone("+55 (44) 99999-8888")).toBe("5544999998888");
    expect(normalizeBrazilPhone("5544999998888")).toBe("5544999998888");
  });

  it("accepts a landline", () => {
    expect(normalizeBrazilPhone("(44) 3525-1234")).toBe("554435251234");
  });

  it("rejects too short, too long and invalid DDD", () => {
    expect(normalizeBrazilPhone("99999-8888")).toBeNull();
    expect(normalizeBrazilPhone("(44) 99999-88889")).toBeNull();
    expect(normalizeBrazilPhone("(05) 99999-8888")).toBeNull();
  });

  it("rejects a mobile number that does not start with 9", () => {
    expect(normalizeBrazilPhone("(44) 89999-8888")).toBeNull();
  });

  it("rejects a landline starting with 9 or 0/1", () => {
    expect(normalizeBrazilPhone("(44) 9525-1234")).toBeNull();
    expect(normalizeBrazilPhone("(44) 1525-1234")).toBeNull();
  });

  it("rejects empty and non-numeric input", () => {
    expect(normalizeBrazilPhone("")).toBeNull();
    expect(normalizeBrazilPhone("abc")).toBeNull();
  });
});

describe("formatBrazilPhone", () => {
  it("formats mobile and landline numbers", () => {
    expect(formatBrazilPhone("5544999998888")).toBe("(44) 99999-8888");
    expect(formatBrazilPhone("554435251234")).toBe("(44) 3525-1234");
  });

  it("returns an empty string for empty input", () => {
    expect(formatBrazilPhone(null)).toBe("");
    expect(formatBrazilPhone(undefined)).toBe("");
  });
});

describe("whatsappUrl", () => {
  it("builds a link with encoded text", () => {
    expect(whatsappUrl("5544999998888", "Olá, tudo bem?")).toBe(
      "https://wa.me/5544999998888?text=Ol%C3%A1%2C%20tudo%20bem%3F",
    );
  });

  it("builds a link without text", () => {
    expect(whatsappUrl("5544999998888")).toBe("https://wa.me/5544999998888");
  });
});
