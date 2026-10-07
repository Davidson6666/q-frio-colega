import { describe, expect, it } from "vitest";
import { selectPlaces, toPlaceResult, type GooglePlace } from "./mapping";

const place = (over: Partial<GooglePlace> = {}): GooglePlace => ({
  id: "p1",
  displayName: { text: "Barbearia Dois Irmãos" },
  formattedAddress: "R. Brasil, 412 - Centro, Campo Mourão - PR, 87300-000, Brasil",
  nationalPhoneNumber: "(44) 99999-8888",
  websiteUri: "https://barbearia.com.br",
  googleMapsUri: "https://maps.google.com/?cid=1",
  rating: 4.8,
  userRatingCount: 212,
  businessStatus: "OPERATIONAL",
  ...over,
});

describe("toPlaceResult", () => {
  it("maps fields and derives WhatsApp from a mobile number", () => {
    const result = toPlaceResult(place());
    expect(result.name).toBe("Barbearia Dois Irmãos");
    expect(result.whatsapp).toBe("5544999998888");
    expect(result.websiteUrl).toBe("https://barbearia.com.br");
    expect(result.rating).toBe(4.8);
  });

  it("gives no WhatsApp for a landline", () => {
    expect(toPlaceResult(place({ nationalPhoneNumber: "(44) 3525-1234" })).whatsapp).toBeNull();
  });

  it("handles missing optional fields", () => {
    const result = toPlaceResult({ id: "x" });
    expect(result).toMatchObject({
      name: "Sem nome",
      phone: null,
      whatsapp: null,
      websiteUrl: null,
      rating: null,
    });
  });

  it("turns a blank website into null", () => {
    expect(toPlaceResult(place({ websiteUri: "  " })).websiteUrl).toBeNull();
  });
});

describe("selectPlaces", () => {
  const opts = { city: "Campo Mourão", uf: "PR", onlyCity: true };

  it("drops closed businesses and duplicates", () => {
    const result = selectPlaces(
      [
        place({ id: "a" }),
        place({ id: "a" }),
        place({ id: "b", businessStatus: "CLOSED_PERMANENTLY" }),
        place({ id: "c", businessStatus: "CLOSED_TEMPORARILY" }),
      ],
      opts,
    );
    expect(result.map((r) => r.id)).toEqual(["a"]);
  });

  it("filters to the requested city and state, ignoring accents and case", () => {
    const result = selectPlaces(
      [
        place({ id: "in" }),
        place({ id: "other-city", formattedAddress: "R. X, 1 - Centro, Maringá - PR, 87000-000, Brasil" }),
        place({ id: "other-state", formattedAddress: "R. X, 1 - Centro, Campo Mourão - SC, 89000-000, Brasil" }),
      ],
      { ...opts, city: "campo mourao" },
    );
    expect(result.map((r) => r.id)).toEqual(["in"]);
  });

  it("keeps neighboring towns when onlyCity is off", () => {
    const result = selectPlaces(
      [place({ id: "in" }), place({ id: "near", formattedAddress: "R. X, 1 - Peabiru - PR, Brasil" })],
      { ...opts, onlyCity: false },
    );
    expect(result.map((r) => r.id)).toEqual(["in", "near"]);
  });

  it("compares the city segment, not any mention of the name", () => {
    const result = selectPlaces(
      [
        place({ id: "street", formattedAddress: "R. dos Santos, 10 - Centro, Campinas - SP, 13000-000, Brasil" }),
        place({ id: "city", formattedAddress: "R. XV de Novembro, 5 - Centro, Santos - SP, 11000-000, Brasil" }),
        place({ id: "avenue", formattedAddress: "Av. Santos Dumont, 1 - Centro, Guarujá - SP, 11400-000, Brasil" }),
      ],
      { city: "Santos", uf: "SP", onlyCity: true },
    );
    expect(result.map((r) => r.id)).toEqual(["city"]);
  });

  it("handles cities with hyphens and compound names", () => {
    const result = selectPlaces(
      [
        place({ id: "embu", formattedAddress: "R. A, 1 - Centro, Embu-Guaçu - SP, 06900-000, Brasil" }),
        place({ id: "embu-das-artes", formattedAddress: "R. A, 1 - Centro, Embu das Artes - SP, 06800-000, Brasil" }),
      ],
      { city: "Embu-Guaçu", uf: "SP", onlyCity: true },
    );
    expect(result.map((r) => r.id)).toEqual(["embu"]);
  });

  it("accepts the comma layout and addresses without a neighborhood", () => {
    const result = selectPlaces(
      [
        place({ id: "comma", formattedAddress: "Rua A, 10, Campo Mourão, PR, Brasil" }),
        place({ id: "short", formattedAddress: "Campo Mourão - PR, Brasil" }),
      ],
      opts,
    );
    expect(result.map((r) => r.id)).toEqual(["comma", "short"]);
  });

  it("does not mistake a street name containing the state letters for the state", () => {
    const result = selectPlaces(
      [place({ id: "x", formattedAddress: "R. Professor Pr, 10 - Centro, Campo Mourão - SP, Brasil" })],
      opts,
    );
    expect(result).toEqual([]);
  });
});
