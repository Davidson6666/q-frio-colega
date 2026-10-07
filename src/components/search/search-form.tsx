"use client";

import { useRef, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/fields";
import { STATES, isUf } from "@/lib/geo/states";
import { cn } from "@/lib/utils";

export interface SearchInput {
  uf: string;
  city: string;
  niche: string;
  onlyCity: boolean;
}

const NICHE_SUGGESTIONS = [
  "barbearia",
  "salão de beleza",
  "restaurante",
  "pizzaria",
  "lanchonete",
  "padaria",
  "academia",
  "clínica odontológica",
  "clínica de estética",
  "pet shop",
  "loja de roupas",
  "oficina mecânica",
  "auto elétrica",
  "escritório de contabilidade",
  "imobiliária",
  "floricultura",
  "material de construção",
  "farmácia",
];

export function SearchForm({
  busy,
  onSearch,
}: {
  busy: boolean;
  onSearch: (input: SearchInput) => void;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const citiesRequest = useRef<AbortController | null>(null);

  // The city list is a convenience for autocomplete; typing a city always works.
  async function loadCities(uf: string) {
    citiesRequest.current?.abort();
    setCities([]);
    if (!isUf(uf)) return;

    const controller = new AbortController();
    citiesRequest.current = controller;
    try {
      const response = await fetch(`/api/cities?uf=${uf}`, { signal: controller.signal });
      if (!response.ok) return;
      const data = (await response.json()) as { cities?: string[] };
      setCities(data.cities ?? []);
    } catch {
      // Aborted or offline: keep the free-text field.
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSearch({
      uf: String(data.get("uf") ?? ""),
      city: String(data.get("city") ?? "").trim(),
      niche: String(data.get("niche") ?? "").trim(),
      onlyCity: data.get("onlyCity") === "on",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-card border border-line bg-surface p-5 shadow-soft sm:p-7"
    >
      <div className="grid gap-5 md:grid-cols-[11rem_1fr_1fr]">
        <div className="grid gap-1.5">
          <label htmlFor="uf" className="text-sm font-medium">
            Estado
          </label>
          <div className="relative">
            <select
              id="uf"
              name="uf"
              required
              defaultValue=""
              onChange={(event) => loadCities(event.target.value)}
              className={cn(inputClassName, "appearance-none pe-11")}
            >
              <option value="" disabled>
                Selecione
              </option>
              {STATES.map((state) => (
                <option key={state.uf} value={state.uf}>
                  {state.uf} - {state.name}
                </option>
              ))}
            </select>
            <CaretDown
              size={18}
              weight="light"
              className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="city" className="text-sm font-medium">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            required
            minLength={2}
            maxLength={80}
            list="city-options"
            autoComplete="off"
            className={inputClassName}
          />
          <datalist id="city-options">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="niche" className="text-sm font-medium">
            Tipo de loja
          </label>
          <input
            id="niche"
            name="niche"
            required
            minLength={2}
            maxLength={60}
            list="niche-options"
            autoComplete="off"
            className={inputClassName}
          />
          <datalist id="niche-options">
            {NICHE_SUGGESTIONS.map((niche) => (
              <option key={niche} value={niche} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="onlyCity" defaultChecked className="size-5 shrink-0 rounded-md" />
          <span>Só lojas dentro da cidade (esconde as das cidades vizinhas)</span>
        </label>

        <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
          <MagnifyingGlass size={20} weight="bold" aria-hidden />
          {busy ? "Buscando…" : "Buscar lojas"}
        </Button>
      </div>
    </form>
  );
}
