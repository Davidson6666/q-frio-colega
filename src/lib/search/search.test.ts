import { describe, expect, it } from "vitest";
import { buildCsv, csvCell, csvFileName } from "./csv";
import { sortResults } from "./sort";
import type { ResultItem } from "./types";

const item = (over: Partial<ResultItem> = {}): ResultItem => ({
  id: "1",
  name: "Loja",
  address: "Rua A, 1",
  phone: null,
  whatsapp: null,
  websiteUrl: null,
  socials: [],
  mapsUrl: null,
  rating: null,
  reviewsCount: null,
  status: "NO_WEBSITE",
  ...over,
});

describe("sortResults", () => {
  it("puts the clearest need first, then more reviews", () => {
    const sorted = sortResults(
      [
        item({ id: "ok", name: "A", status: "OK", reviewsCount: 500 }),
        item({ id: "broken", name: "B", status: "BROKEN", reviewsCount: 10 }),
        item({ id: "none-few", name: "C", status: "NO_WEBSITE", reviewsCount: 5 }),
        item({ id: "none-many", name: "D", status: "NO_WEBSITE", reviewsCount: 90 }),
        item({ id: "checking", name: "E", status: "CHECKING", reviewsCount: 999 }),
      ],
      "promising",
    );
    expect(sorted.map((r) => r.id)).toEqual(["none-many", "none-few", "broken", "ok", "checking"]);
  });

  it("sorts by rating, treating missing as lowest", () => {
    const sorted = sortResults(
      [item({ id: "a", rating: null }), item({ id: "b", rating: 4.9 }), item({ id: "c", rating: 4.1 })],
      "rating",
    );
    expect(sorted.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts names with Portuguese collation (accents)", () => {
    const sorted = sortResults(
      [item({ id: "z", name: "Zeca" }), item({ id: "a", name: "Álvaro" }), item({ id: "b", name: "Bia" })],
      "name",
    );
    expect(sorted.map((r) => r.id)).toEqual(["a", "b", "z"]);
  });

  it("does not mutate the input", () => {
    const input = [item({ id: "b", name: "B" }), item({ id: "a", name: "A" })];
    sortResults(input, "name");
    expect(input.map((r) => r.id)).toEqual(["b", "a"]);
  });
});

describe("csvCell", () => {
  it("quotes and escapes", () => {
    expect(csvCell('Loja "Boa"; Centro')).toBe('"Loja ""Boa""; Centro"');
  });

  it("neutralizes spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvCell("+55 44 9999")).toBe('"\'+55 44 9999"');
    expect(csvCell("-1")).toBe('"\'-1"');
    expect(csvCell("@cmd")).toBe('"\'@cmd"');
  });

  it("renders empty values as empty cells", () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });
});

describe("buildCsv", () => {
  it("starts with a BOM, uses semicolons and a decimal comma", () => {
    const csv = buildCsv([
      item({
        name: "Barbearia Dois Irmãos",
        phone: "(44) 99999-8888",
        whatsapp: "5544999998888",
        websiteUrl: "https://x.com.br",
        status: "BROKEN",
        rating: 4.8,
        reviewsCount: 212,
        check: { httpStatus: 404, ttfbMs: 100, finalUrl: null, hasViewport: null, reason: "A página inicial não existe (erro 404)." },
      }),
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    const [header, row] = csv.trim().split("\r\n");
    expect(header.split(";")).toHaveLength(12);
    expect(row).toContain('"4,8"');
    expect(row).toContain('"https://wa.me/5544999998888"');
    expect(row).toContain('"Site com problema"');
  });
});

describe("buildCsv with a possible site", () => {
  it("adds the guessed address and says how strong the evidence is", () => {
    const csv = buildCsv([
      item({
        status: "POSSIBLE_SITE",
        guess: { url: "https://pizzariafornetto.com.br/", evidence: ["nome no título"], strength: "weak" },
      }),
      item({
        id: "2",
        status: "POSSIBLE_SITE",
        guess: { url: "https://botecodonachica.com.br/", evidence: ["nome no título", "cidade", "telefone"], strength: "strong" },
      }),
      item({ id: "3" }),
    ]);
    const [, weak, strong, none] = csv.trim().split("\r\n");
    expect(weak).toContain('"https://pizzariafornetto.com.br/";"fraca: nome no título"');
    expect(strong).toContain('"https://botecodonachica.com.br/";"forte: nome no título, cidade, telefone"');
    expect(none).toContain('"";"";'); // no guess: both columns empty
    expect(weak).toContain('"Possível site"');
  });
});

describe("csvFileName", () => {
  it("builds a safe slug", () => {
    expect(csvFileName("Campo Mourão", "PR", "Salão de beleza")).toBe(
      "garimpo-campo-mourao-pr-salao-de-beleza.csv",
    );
  });
});
