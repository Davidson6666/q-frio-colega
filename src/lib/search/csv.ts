import { STATUS_META } from "@/lib/analysis/labels";
import type { ResultItem } from "./types";

const HEADER = [
  "Nome",
  "Endereço",
  "Telefone",
  "WhatsApp",
  "Site",
  "Situação do site",
  "Detalhe da checagem",
  "Nota",
  "Avaliações",
  "Google Maps",
];

/**
 * One cell, safe for Excel and Google Sheets.
 * Business names and addresses come from third parties: a value starting with
 * = + - @ (or a tab/CR) would be executed as a formula, so it gets a leading apostrophe.
 */
export function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Semicolon separated with a BOM: that is what Excel in pt-BR opens correctly
 * (accents intact, columns split) when the file is double-clicked.
 */
export function buildCsv(results: ResultItem[]): string {
  const rows = results.map((r) => [
    r.name,
    r.address,
    r.phone,
    r.whatsapp ? `https://wa.me/${r.whatsapp}` : "",
    r.websiteUrl,
    STATUS_META[r.status].label,
    r.check?.reason ?? "",
    r.rating === null ? "" : String(r.rating).replace(".", ","),
    r.reviewsCount,
    r.mapsUrl,
  ]);

  const lines = [HEADER, ...rows].map((row) => row.map(csvCell).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** "Campo Mourão", "PR", "barbearia" -> "garimpo-campo-mourao-pr-barbearia.csv" */
export function csvFileName(city: string, uf: string, niche: string): string {
  const slug = [city, uf, niche]
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `garimpo-${slug}.csv`;
}
