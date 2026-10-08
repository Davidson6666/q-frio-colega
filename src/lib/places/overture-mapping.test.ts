import { describe, expect, it } from "vitest";
import { dedupeRows, pickWebsite, toPlaceResult, type OvertureRow } from "./overture-mapping";

const row = (over: Partial<OvertureRow> = {}): OvertureRow => ({
  id: "ovt-1",
  name: "Barbearia Fio da Navalha",
  street: "Av. Afonso Botelho, 1106",
  locality: "Campo Mourão",
  region: "PR",
  phones: ["+554435251823"],
  websites: ["http://barbeariafiodanavalha.com.br/"],
  socials: ["https://www.facebook.com/fiodanavalha"],
  confidence: 0.99,
  category: "barber",
  hierarchy: ["lifestyle_services", "personal_or_beauty_service", "barber"],
  ...over,
});

describe("pickWebsite", () => {
  it("prefers an own site over a social page", () => {
    expect(pickWebsite(["https://instagram.com/loja", "https://loja.com.br"])).toBe("https://loja.com.br");
  });

  it("prefers an institutional site over a social page, but not over an own site", () => {
    const school = "http://www.cpmrondon.seed.pr.gov.br/";
    expect(pickWebsite(["https://instagram.com/x", school])).toBe(school);
    expect(pickWebsite([school, "https://lojadoposto.com.br"])).toBe("https://lojadoposto.com.br");
  });

  it("falls back to a social page, and to null when nothing usable", () => {
    expect(pickWebsite(["https://instagram.com/loja"])).toBe("https://instagram.com/loja");
    expect(pickWebsite([])).toBeNull();
  });

  it("ignores webmail homepages, malformed values and non-http schemes", () => {
    expect(pickWebsite(["http://yahoo.com.br/"])).toBeNull();
    expect(pickWebsite(["not a url", "javascript:alert(1)", "ftp://x.com"])).toBeNull();
    expect(pickWebsite(["www.semprotocolo.com.br"])).toBeNull();
  });
});

describe("toPlaceResult", () => {
  it("formats address, phone and builds a Maps search link", () => {
    const place = toPlaceResult(row());
    expect(place.address).toBe("Av. Afonso Botelho, 1106, Campo Mourão - PR");
    expect(place.phone).toBe("(44) 3525-1823");
    expect(place.mapsUrl).toContain("https://www.google.com/maps/search/?api=1&query=");
    expect(place.mapsUrl).toContain(encodeURIComponent("Barbearia Fio da Navalha"));
    expect(place.rating).toBeNull();
    expect(place.reviewsCount).toBeNull();
  });

  it("derives WhatsApp only from a mobile number, even if it is not the first phone", () => {
    const place = toPlaceResult(row({ phones: ["+554435251823", "+5544998846848"] }));
    expect(place.phone).toBe("(44) 3525-1823");
    expect(place.whatsapp).toBe("5544998846848");
  });

  it("has no WhatsApp when there are only landlines", () => {
    expect(toPlaceResult(row({ phones: ["+554435251823"] })).whatsapp).toBeNull();
  });

  it("copes with missing phone, address and websites", () => {
    const place = toPlaceResult(row({ phones: [], websites: [], socials: [], street: null, region: null }));
    expect(place.phone).toBeNull();
    expect(place.websiteUrl).toBeNull();
    expect(place.socials).toEqual([]);
    expect(place.address).toBe("Campo Mourão");
  });

  it("keeps only http(s) social links", () => {
    const place = toPlaceResult(row({ socials: ["https://instagram.com/x", "javascript:alert(1)", "x"] }));
    expect(place.socials).toEqual(["https://instagram.com/x"]);
  });
});

describe("dedupeRows", () => {
  it("merges the same name and street, keeping the most confident", () => {
    const rows = dedupeRows([
      row({ id: "a", confidence: 0.6 }),
      row({ id: "b", confidence: 0.95, name: "BARBEARIA FIO DA NAVALHA", street: "av. afonso botelho, 1106" }),
      row({ id: "c", name: "Outra Barbearia" }),
    ]);
    expect(rows.map((r) => r.id).sort()).toEqual(["b", "c"]);
  });

  it("keeps the website of a less confident duplicate", () => {
    const [merged] = dedupeRows([
      row({ id: "meta", confidence: 0.9, websites: [], socials: ["https://facebook.com/x"] }),
      row({ id: "fsq", confidence: 0.8, websites: ["https://lojareal.com.br"], socials: [], phones: ["+554499998888"] }),
    ]);
    expect(merged.id).toBe("meta");
    expect(merged.websites).toEqual(["https://lojareal.com.br"]);
    expect(merged.phones).toContain("+554499998888");
    expect(merged.socials).toEqual(["https://facebook.com/x"]);
  });

  it("does not merge two branches that have no street and no phone", () => {
    const rows = dedupeRows([
      row({ id: "a", name: "Farmácia Pague Menos", street: null, phones: [] }),
      row({ id: "b", name: "Farmácia Pague Menos", street: null, phones: [] }),
    ]);
    expect(rows).toHaveLength(2);
  });

  it("merges records with no street when they share a phone number", () => {
    const rows = dedupeRows([
      row({ id: "a", street: null, phones: ["+554435251823"] }),
      row({ id: "b", street: null, phones: ["+55 (44) 3525-1823"] }),
    ]);
    expect(rows).toHaveLength(1);
  });

  it("keeps two branches of the same name on different streets", () => {
    const rows = dedupeRows([row({ id: "a" }), row({ id: "b", street: "Rua Outra, 10" })]);
    expect(rows).toHaveLength(2);
  });
});
