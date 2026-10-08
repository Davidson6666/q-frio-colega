import { describe, expect, it } from "vitest";
import { NICHES, matchesNiche, resolveNiche } from "./niches";

describe("resolveNiche", () => {
  it("matches labels ignoring case, accents and a plural s", () => {
    for (const input of ["Barbearia", "barbearia", "BARBEARIAS", " barbearia "]) {
      const query = resolveNiche(input);
      expect(query.kind).toBe("category");
      if (query.kind === "category") expect(query.niche.label).toBe("Barbearia");
    }
    const salon = resolveNiche("salao de beleza");
    expect(salon.kind === "category" && salon.niche.label).toBe("Salão de beleza");
  });

  it("matches aliases", () => {
    const dentist = resolveNiche("dentista");
    expect(dentist.kind === "category" && dentist.niche.label).toBe("Clínica odontológica");
    const pet = resolveNiche("Petshop");
    expect(pet.kind === "category" && pet.niche.label).toBe("Pet shop");
  });

  it("falls back to a name search for unknown text", () => {
    expect(resolveNiche("Barbearia do Zé")).toEqual({ kind: "name", text: "barbearia do ze" });
    expect(resolveNiche("floricultura")).toEqual({ kind: "name", text: "floricultura" });
  });

  it("has no label or alias claimed by two niches", () => {
    const seen = new Map<string, string>();
    for (const niche of NICHES) {
      for (const word of [niche.label, ...niche.aliases]) {
        const key = resolveNiche(word);
        expect(key.kind === "category" && key.niche.label, `"${word}" resolves to another niche`).toBe(niche.label);
        seen.set(word, niche.label);
      }
    }
  });
});

describe("matchesNiche", () => {
  const restaurantHierarchy = ["food_and_drink", "restaurant", "european_restaurant", "pizza_restaurant"];

  it("matches by any level of the category hierarchy", () => {
    const restaurant = resolveNiche("restaurante");
    expect(matchesNiche(restaurant, { name: "Cantina", hierarchy: restaurantHierarchy })).toBe(true);
    const pizza = resolveNiche("pizzaria");
    expect(matchesNiche(pizza, { name: "Cantina", hierarchy: restaurantHierarchy })).toBe(true);
    const barber = resolveNiche("barbearia");
    expect(matchesNiche(barber, { name: "Cantina", hierarchy: restaurantHierarchy })).toBe(false);
  });

  it("searches names for free text, ignoring accents", () => {
    const query = resolveNiche("floricultura");
    expect(matchesNiche(query, { name: "Floricultura Rosa Bela", hierarchy: [] })).toBe(true);
    expect(matchesNiche(query, { name: "Padaria Central", hierarchy: [] })).toBe(false);
    expect(matchesNiche(resolveNiche("ze"), { name: "Barbearia do Zé", hierarchy: [] })).toBe(true);
  });
});
