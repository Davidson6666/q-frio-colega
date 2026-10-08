import { describe, expect, it } from "vitest";
import {
  describeEvidence,
  distinctiveWords,
  evaluateEvidence,
  evidenceStrength,
  guessCandidates,
  pageText,
  socialNeedles,
} from "./domain-guess";

describe("distinctiveWords", () => {
  it("drops generic, title and city words", () => {
    expect(distinctiveWords("Barbearia Seu Bigode", "Campo Mourão")).toEqual(["seu", "bigode"]);
    expect(distinctiveWords("Dr. Eufânio Saqueti", "Campo Mourão")).toEqual(["eufanio", "saqueti"]);
    expect(distinctiveWords("Pizzaria Fornetto Campo Mourão", "Campo Mourão")).toEqual(["fornetto"]);
  });

  it("is empty for a name made only of generic words", () => {
    expect(distinctiveWords("Farmácia Central de Campo Mourão", "Campo Mourão")).toEqual([]);
  });
});

describe("guessCandidates", () => {
  it("builds the full-name and distinctive-part domains on two TLDs", () => {
    expect(guessCandidates("Pizzaria Fornetto", "Campo Mourão")).toEqual([
      "pizzariafornetto.com.br",
      "pizzariafornetto.com",
      "fornetto.com.br",
      "fornetto.com",
    ]);
  });

  it("does not repeat a slug when both forms are identical", () => {
    expect(guessCandidates("Fornetto", "Campo Mourão")).toEqual(["fornetto.com.br", "fornetto.com"]);
  });

  it("skips names that are too short to guess from", () => {
    expect(guessCandidates("Zé", "Campo Mourão")).toEqual([]);
    expect(guessCandidates("Bar do Zé", "Campo Mourão")).toEqual([]);
  });

  it("only ever produces plain hostnames", () => {
    for (const candidate of guessCandidates("Café & Cia. <script>/../x?y=1", "São Paulo")) {
      expect(candidate).toMatch(/^[a-z0-9]+\.(com\.br|com)$/);
    }
  });

  it("removes accents", () => {
    expect(guessCandidates("Açaí Brasília", "Campo Mourão")).toContain("acaibrasilia.com.br");
  });
});

describe("pageText", () => {
  it("removes scripts, styles and tags and decodes entities", () => {
    const html =
      "<style>.a{color:red}</style><script>var cidade='Londrina'</script><h1>Campo Mour&atilde;o &#8211; Centro</h1>";
    const text = pageText(html);
    expect(text).toContain("Campo Mourão");
    expect(text).not.toContain("Londrina");
    expect(text).not.toContain("color");
  });
});

describe("socialNeedles", () => {
  it("keeps host and path, without www, query string or trailing slash", () => {
    expect(socialNeedles(["https://www.facebook.com/FioDaNavalha/?ref=x"])).toEqual(["facebook.com/fiodanavalha"]);
    expect(socialNeedles(["https://instagram.com/seubigodee"])).toEqual(["instagram.com/seubigodee"]);
  });

  it("ignores profiles with no usable path and malformed values", () => {
    expect(socialNeedles(["https://facebook.com/", "https://facebook.com/ab", "not a url", ""])).toEqual([]);
  });
});

describe("evidence", () => {
  const store = { name: "Pizzaria Fornetto", city: "Campo Mourão", phones: ["4435251823"] };
  const host = "pizzariafornetto.com.br";

  it("is strong when the name and the city appear in the page", () => {
    const evidence = evaluateEvidence({
      ...store,
      html: "<title>Início</title><p>Pizzaria Fornetto</p><p>Rua Brasil, Campo Mour&atilde;o - PR</p>",
    });
    expect(evidence).toEqual({ social: false, title: false, name: true, city: true, phone: false });
    expect(evidenceStrength(evidence, host)).toBe("strong");
    expect(describeEvidence(evidence)).toEqual(["nome", "cidade"]);
  });

  it("is strong with the name and the phone, with or without area code and formatting", () => {
    const html = "<title>Início</title><p>Fornetto</p><p>Telefone: (44) 3525-1823</p>";
    expect(evaluateEvidence({ ...store, html }).phone).toBe(true);
    const noArea = "<title>Início</title><p>Fornetto</p><p>Telefone: 3525-1823</p>";
    expect(evidenceStrength(evaluateEvidence({ ...store, html: noArea }), host)).toBe("strong");
  });

  it("is strong when the page links to the store's own social profile, whatever the name says", () => {
    const evidence = evaluateEvidence({
      name: "Mendes",
      city: "Campo Mourão",
      phones: [],
      socials: ["https://www.facebook.com/mendescampomourao"],
      html: '<title>Home</title><a href="https://facebook.com/mendescampomourao/">Facebook</a>',
    });
    expect(evidence.social).toBe(true);
    expect(evidenceStrength(evidence, "mendes.com")).toBe("strong");
    expect(describeEvidence(evidence)).toContain("mesma rede social");
  });

  it("does not count a social link that belongs to someone else", () => {
    const evidence = evaluateEvidence({
      name: "Mendes",
      city: "Campo Mourão",
      phones: [],
      socials: ["https://www.facebook.com/mendescampomourao"],
      html: '<title>Mendes</title><a href="https://facebook.com/outraempresa">Facebook</a>',
    });
    expect(evidence.social).toBe(false);
  });

  describe("a title that states the whole store name", () => {
    it("is only a weak signal on a long .com.br name, with no city or phone", () => {
      // Many small sites build their contact details with JavaScript, so the home page text has neither.
      const evidence = evaluateEvidence({ ...store, html: "<title>Pizzaria Fornetto</title><div id=app></div>" });
      expect(evidence.title).toBe(true);
      expect(evidence.city).toBe(false);
      expect(evidenceStrength(evidence, host)).toBe("weak");
      expect(describeEvidence(evidence)).toEqual(["nome no título"]);
    });

    it("is not enough on a .com host: namesakes abroad would pass (babykids.com, orthodontic.com)", () => {
      const evidence = evaluateEvidence({
        name: "Baby kid's",
        city: "Campo Mourão",
        phones: [],
        html: "<title>Baby Kids</title>",
      });
      expect(evidence.title).toBe(true);
      expect(evidenceStrength(evidence, "babykids.com")).toBeNull();
    });

    it("is not enough for a short name, even on .com.br", () => {
      const evidence = evaluateEvidence({ name: "Mendes", city: "Campo Mourão", phones: [], html: "<title>Mendes</title>" });
      expect(evidence.title).toBe(true);
      expect(evidenceStrength(evidence, "mendes.com.br")).toBeNull();
    });

    it("becomes strong on any host when the city or phone also appear", () => {
      const evidence = evaluateEvidence({
        name: "Kalema's Motel",
        city: "Campo Mourão",
        phones: [],
        html: "<title>Kalemas Motel</title><p>Campo Mourão - PR</p>",
      });
      expect(evidenceStrength(evidence, "kalemasmotel.com")).toBe("strong");
    });

    it("matches a title that writes the name as one word or adds a slogan", () => {
      const radiology = { name: "Rad Imagem", city: "Campo Mourão", phones: [] };
      expect(
        evaluateEvidence({ ...radiology, html: "<title>Home - Radimagem - Diagnóstico por Imagem</title>" }).title,
      ).toBe(true);
      const clinic = { name: "Clínica Corpo e Mente", city: "Campo Mourão", phones: [] };
      expect(
        evaluateEvidence({ ...clinic, html: "<title>Início Da Jornada Saudável - Clínica Corpo E Mente</title>" }).title,
      ).toBe(true);
    });

    it("reads the site name from share metadata when the title is generic", () => {
      const html = '<title>Home</title><meta property="og:site_name" content="Pizzaria Fornetto">';
      expect(evaluateEvidence({ ...store, html }).title).toBe(true);
      const single = "<title>Home</title><meta content='Pizzaria Fornetto' name='og:title'>";
      expect(evaluateEvidence({ ...store, html: single }).title).toBe(true);
    });

    it("does NOT accept a title that only shares one word of the name", () => {
      // "Pet shop Bufalo" vs an association of buffalo breeders, and "Studio Priorize" vs an IT company.
      const buffalo = evaluateEvidence({
        name: "Pet shop Búfalo",
        city: "Campo Mourão",
        phones: [],
        html: "<title>ABCB | Associação Brasileira de Criadores de Búfalo</title>",
      });
      expect(buffalo.title).toBe(false);
      expect(evidenceStrength(buffalo, "petshopbufalo.com.br")).toBeNull();

      const itCompany = evaluateEvidence({
        name: "Studio Priorize",
        city: "Campo Mourão",
        phones: [],
        html: "<title>Priori Tecnologia da Informação</title>",
      });
      expect(itCompany.title).toBe(false);
    });

    it("accepts the distinctive part alone only when it has at least two words", () => {
      const twoWords = evaluateEvidence({
        name: "Studio Corte Fino",
        city: "Campo Mourão",
        phones: [],
        html: "<title>Corte Fino | Cabelo e barba</title>",
      });
      expect(twoWords.title).toBe(true);

      const oneWord = evaluateEvidence({
        name: "Barbearia Premium",
        city: "Campo Mourão",
        phones: [],
        html: "<title>Premium Consultoria Empresarial</title>",
      });
      expect(oneWord.title).toBe(false);
    });

    it("ignores a title that is too short to mean anything", () => {
      const evidence = evaluateEvidence({ name: "Zé", city: "Campo Mourão", phones: [], html: "<title>Zé</title>" });
      expect(evidence.title).toBe(false);
    });
  });

  it("is NOT strong when only the name matches in the body (a different business with the same word)", () => {
    const evidence = evaluateEvidence({
      name: "Pet shop Búfalo",
      city: "Campo Mourão",
      phones: [],
      html: "<title>Início</title><p>Criadores de Búfalo</p><p>Brasília</p>",
    });
    expect(evidence.name).toBe(true);
    expect(evidenceStrength(evidence, "bufalo.com.br")).toBeNull();
  });

  it("is NOT strong when only the city matches", () => {
    const evidence = evaluateEvidence({ ...store, html: "<title>Prefeitura</title><p>Campo Mourão</p>" });
    expect(evidence.name).toBe(false);
    expect(evidenceStrength(evidence, host)).toBeNull();
  });

  it("needs every distinctive word of the name", () => {
    const evidence = evaluateEvidence({
      name: "Studio Corte Fino",
      city: "Campo Mourão",
      phones: [],
      html: "<title>Início</title><p>Corte</p><p>Campo Mourão</p>",
    });
    expect(evidence.name).toBe(false);
  });

  it("ignores words shorter than 4 letters, which are too common to prove anything", () => {
    const evidence = evaluateEvidence({
      name: "Barbearia Seu Bigode",
      city: "Campo Mourão",
      phones: [],
      html: "<title>Início</title><p>Bigode</p><p>Campo Mourão</p>",
    });
    expect(evidence.name).toBe(true);
  });

  it("never matches a name made only of generic words", () => {
    const evidence = evaluateEvidence({
      name: "Farmácia Central",
      city: "Campo Mourão",
      phones: [],
      html: "<title>Farmácia Central</title><p>Campo Mourão</p>",
    });
    expect(evidence.name).toBe(false);
  });

  it("ignores very short phone numbers", () => {
    const evidence = evaluateEvidence({ ...store, phones: ["123"], html: "<p>123 Fornetto Campo Mourão</p>" });
    expect(evidence.phone).toBe(false);
  });
});

describe("evidence is matched on whole words, whole handles and whole numbers", () => {
  const city = "São Paulo";

  it("does not match a name inside a longer word (Silva vs Silvana)", () => {
    const evidence = evaluateEvidence({
      name: "Barbearia Silva",
      city,
      phones: [],
      html: "<title>Silvana Imóveis</title><p>Silvana Imóveis, São Paulo - SP</p>",
    });
    expect(evidence.name).toBe(false);
    expect(evidence.city).toBe(true);
    expect(evidenceStrength(evidence, "silva.com.br")).toBeNull();
  });

  it("does not trust a single short surname-like word even when it matches exactly", () => {
    // "Silva" names thousands of businesses: with the city on the page it would otherwise be "strong".
    const evidence = evaluateEvidence({
      name: "Barbearia Silva",
      city,
      phones: [],
      html: "<title>Início</title><p>Silva</p><p>São Paulo - SP</p>",
    });
    expect(evidence.name).toBe(false);
  });

  it("trusts a single long distinctive word on a whole-word match only", () => {
    const base = { name: "Clínica Hipernefro", city: "Campo Mourão", phones: [] };
    expect(evaluateEvidence({ ...base, html: "<p>Clínica Hipernefro em Campo Mourão</p>" }).name).toBe(true);
    expect(evaluateEvidence({ ...base, html: "<p>Hipernefrologia avançada em Campo Mourão</p>" }).name).toBe(false);
  });

  it("does not match a city name that is the start of a longer place name", () => {
    const evidence = evaluateEvidence({
      name: "Studio Corte Fino",
      city: "Campo Mourão",
      phones: [],
      html: "<p>Studio Corte Fino, Campo Mourãozinho</p>",
    });
    expect(evidence.city).toBe(false);
  });

  it("does not take another profile that merely starts with the same handle", () => {
    const store = { name: "Mendes", city: "Campo Mourão", phones: [], socials: ["https://www.instagram.com/fiodanavalha"] };
    expect(evaluateEvidence({ ...store, html: '<a href="https://instagram.com/fiodanavalha_studio">x</a>' }).social).toBe(false);
    expect(evaluateEvidence({ ...store, html: '<a href="https://instagram.com/fiodanavalha.oficial">x</a>' }).social).toBe(false);
    expect(evaluateEvidence({ ...store, html: '<a href="https://instagram.com/fiodanavalha2">x</a>' }).social).toBe(false);
  });

  it("takes the exact handle, however it is closed", () => {
    const store = { name: "Mendes", city: "Campo Mourão", phones: [], socials: ["https://www.instagram.com/fiodanavalha"] };
    for (const html of [
      '<a href="https://instagram.com/fiodanavalha">x</a>',
      '<a href="https://www.instagram.com/fiodanavalha/">x</a>',
      '<a href="https://instagram.com/fiodanavalha?igsh=abc">x</a>',
      "<p>Siga instagram.com/fiodanavalha.</p>",
    ]) {
      expect(evaluateEvidence({ ...store, html }).social, html).toBe(true);
    }
  });

  it("does not build a phone number out of digits of different numbers", () => {
    // The store's number ends in 3525 1823. These are item codes, not a phone number.
    const evidence = evaluateEvidence({
      name: "Pizzaria Fornetto",
      city: "Campo Mourão",
      phones: ["4435251823"],
      html: "<p>Itens 3525, 1823 e códigos 44 e 35, 25, 18, 23</p>",
    });
    expect(evidence.phone).toBe(false);
  });

  it("finds the phone number in the usual written forms", () => {
    const phones = ["4435251823"];
    const forms = ["(44) 3525-1823", "44 3525-1823", "3525-1823", "+55 (44) 3525 1823", "44.3525.1823", "4435251823"];
    for (const form of forms) {
      const evidence = evaluateEvidence({ name: "Pizzaria Fornetto", city: "Campo Mourão", phones, html: `<p>Ligue ${form}</p>` });
      expect(evidence.phone, form).toBe(true);
    }
  });

  it("still sees the visible text when a huge script comes first", () => {
    const html = `<head><script>var data="${"x".repeat(200_000)}"</script></head><body><p>Pizzaria Fornetto, Campo Mourão</p></body>`;
    const evidence = evaluateEvidence({ name: "Pizzaria Fornetto", city: "Campo Mourão", phones: [], html });
    expect(evidence.name).toBe(true);
    expect(evidence.city).toBe(true);
  });

  it("still reads the title when a huge style block comes first", () => {
    const html = `<head><style>${"a{b:c}".repeat(40_000)}</style><title>Pizzaria Fornetto</title></head>`;
    expect(evaluateEvidence({ name: "Pizzaria Fornetto", city: "Campo Mourão", phones: [], html }).title).toBe(true);
  });
});
