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

  it("ignores webmail and search homepages typed into the website field", () => {
    expect(classifyUrl("http://yahoo.com.br/")).toBe("none");
    expect(classifyUrl("https://www.gmail.com")).toBe("none");
    expect(classifyUrl("https://google.com.br/")).toBe("none");
  });

  it("treats booking pages and form links as not an own site", () => {
    expect(classifyUrl("http://www.easybarber.com.br/CadastroClienteWebEasyBarber?w=67&x=o")).toBe("social");
    expect(classifyUrl("https://docs.google.com/forms/d/abc")).toBe("social");
    expect(classifyUrl("https://calendly.com/loja")).toBe("social");
  });

  it("does not treat a normal company domain that merely contains a listed word as noise", () => {
    expect(classifyUrl("https://gmail.com.evil.example")).toBe("own");
    expect(classifyUrl("https://meugoogle.com.br")).toBe("own");
  });

  it("treats public bodies as institutional", () => {
    expect(classifyUrl("http://www.cpmrondon.seed.pr.gov.br/")).toBe("institutional");
    expect(classifyUrl("https://www.tjpr.jus.br")).toBe("institutional");
    expect(classifyUrl("https://camara.leg.br")).toBe("institutional");
  });

  it("treats a brand's site as not the store's own, including subdomains", () => {
    // A franchise that lists only its brand's site has no site of its own: it is a lead.
    expect(classifyUrl("http://www.ipiranga.com.br")).toBe("social");
    expect(classifyUrl("https://lojas.boticario.com.br/campo-mourao")).toBe("social");
    expect(classifyUrl("https://www.sicredi.com.br/agencia")).toBe("social");
  });

  it("does not mistake a small business whose name merely resembles a brand", () => {
    expect(classifyUrl("https://shellmodas.com.br")).toBe("own");
    expect(classifyUrl("https://meuitau.com.br")).toBe("own");
    expect(classifyUrl("https://ipiranga.com.br.evil.example")).toBe("own");
    expect(classifyUrl("https://governo.com.br")).toBe("own");
  });

  it("treats business directories as not an own site", () => {
    expect(classifyUrl("http://www.guiamais.com/")).toBe("social");
    expect(classifyUrl("https://www.apontador.com.br/local/x")).toBe("social");
  });

  it("rejects malformed and non-http URLs", () => {
    expect(classifyUrl("not a url")).toBe("invalid");
    expect(classifyUrl("javascript:alert(1)")).toBe("invalid");
    expect(classifyUrl("ftp://files.example.com")).toBe("invalid");
  });
});
