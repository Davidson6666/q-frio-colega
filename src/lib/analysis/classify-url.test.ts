import { describe, expect, it } from "vitest";
import { classifyUrl } from "./classify-url";

describe("classifyUrl", () => {
  it("treats empty values as no website", () => {
    expect(classifyUrl(undefined)).toBe("none");
    expect(classifyUrl(null)).toBe("none");
    expect(classifyUrl("")).toBe("none");
    expect(classifyUrl("   ")).toBe("none");
  });

  it("treats social and link-in-bio pages as social only", () => {
    expect(classifyUrl("https://www.instagram.com/barbearia")).toBe("social");
    expect(classifyUrl("https://instagram.com/barbearia/")).toBe("social");
    expect(classifyUrl("https://pt-br.facebook.com/loja")).toBe("social");
    expect(classifyUrl("https://linktr.ee/loja")).toBe("social");
    expect(classifyUrl("https://wa.me/5544999998888")).toBe("social");
    expect(classifyUrl("https://www.ifood.com.br/delivery/x")).toBe("social");
  });

  it("does not confuse look-alike domains with social hosts", () => {
    expect(classifyUrl("https://notinstagram.com")).toBe("own");
    expect(classifyUrl("https://instagram.com.evil.example")).toBe("own");
  });

  it("treats a normal domain as an own website", () => {
    expect(classifyUrl("https://barbeariadoisirmaos.com.br")).toBe("own");
    expect(classifyUrl("http://www.clinica.com.br/contato")).toBe("own");
  });

  it("rejects malformed and non-http URLs", () => {
    expect(classifyUrl("not a url")).toBe("invalid");
    expect(classifyUrl("javascript:alert(1)")).toBe("invalid");
    expect(classifyUrl("ftp://files.example.com")).toBe("invalid");
  });
});
