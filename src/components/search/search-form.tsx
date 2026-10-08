"use client";

import { useRef, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/fields";
import { STATES, isUf } from "@/lib/geo/states";
import { NICHES } from "@/lib/places/niches";
import type { PlacesSource } from "@/lib/places/types";
import { cn } from "@/lib/utils";

export interface SearchInput {
  uf: string;
  city: string;
  niche: string;
  onlyCity: boolean;
}

type CitiesStatus = "idle" | "loading" | "ready" | "error";

const byName = (a: string, b: string) => a.localeCompare(b, "pt-BR");

export function SearchForm({
  source,
  busy,
  onSearch,
}: {
  source: PlacesSource;
  busy: boolean;
  onSearch: (input: SearchInput) => void;
}) {
  const [uf, setUf] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [status, setStatus] = useState<CitiesStatus>("idle");
  const citiesRequest = useRef<AbortController | null>(null);

  async function selectState(value: string) {
    citiesRequest.current?.abort();
    setUf(value);
    setCities([]);
    if (!isUf(value)) {
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const controller = new AbortController();
    citiesRequest.current = controller;
    try {
      const response = await fetch(`/api/cities?uf=${value}`, { signal: controller.signal });
      const data = response.ok ? ((await response.json()) as { cities?: string[] }) : null;
      if (controller.signal.aborted) return;

      const list = [...(data?.cities ?? [])].sort(byName);
      setCities(list);
      setStatus(list.length > 0 ? "ready" : "error");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSearch({
      uf: String(data.get("uf") ?? ""),
      city: String(data.get("city") ?? "").trim(),
      niche: String(data.get("niche") ?? "").trim(),
      // Overture lists are city-exact already; only Google needs the neighbour-town filter.
      onlyCity: source === "google" ? data.get("onlyCity") === "on" : true,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-card border border-line bg-surface p-5 shadow-soft sm:p-7"
    >
      <div className="grid gap-5 md:grid-cols-[11rem_1fr_1fr]">
        <div className="grid content-start gap-1.5">
          <label htmlFor="uf" className="text-sm font-medium">
            Estado
          </label>
          <div className="relative">
            <select
              id="uf"
              name="uf"
              required
              value={uf}
              onChange={(event) => selectState(event.target.value)}
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

        <div className="grid content-start gap-1.5">
          <label htmlFor="city" className="text-sm font-medium">
            Cidade
          </label>

          {status === "error" ? (
            // The list could not be loaded: typing the name keeps the tool usable.
            <>
              <input
                id="city"
                name="city"
                required
                minLength={2}
                maxLength={80}
                autoComplete="off"
                aria-describedby="city-hint"
                className={inputClassName}
              />
              <p id="city-hint" className="text-sm text-warn">
                Não consegui carregar a lista de cidades. Digite o nome da cidade.
              </p>
            </>
          ) : (
            <>
              <div className="relative">
                <select
                  // New key per state, so a city from the previous state is never kept selected.
                  key={uf || "none"}
                  id="city"
                  name="city"
                  required
                  defaultValue=""
                  disabled={status !== "ready"}
                  aria-describedby="city-hint"
                  className={cn(inputClassName, "appearance-none pe-11")}
                >
                  <option value="" disabled>
                    {status === "loading"
                      ? "Carregando cidades…"
                      : status === "ready"
                        ? "Selecione a cidade"
                        : "Escolha o estado primeiro"}
                  </option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
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
              <p id="city-hint" className="text-sm text-muted" aria-live="polite">
                {status === "ready"
                  ? `${cities.length} cidades em ordem alfabética. Digite a inicial para pular.`
                  : status === "loading"
                    ? "Carregando…"
                    : "As cidades aparecem depois que você escolhe o estado."}
              </p>
            </>
          )}
        </div>

        <div className="grid content-start gap-1.5">
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
            aria-describedby="niche-hint"
            className={inputClassName}
          />
          <p id="niche-hint" className="text-sm text-muted">
            Escolha uma sugestão da lista. Outros termos procuram no nome da loja.
          </p>
          <datalist id="niche-options">
            {NICHES.map((niche) => (
              <option key={niche.label} value={niche.label} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        {source === "google" ? (
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="onlyCity" defaultChecked className="size-5 shrink-0 rounded-md" />
            <span>Só lojas dentro da cidade (esconde as das cidades vizinhas)</span>
          </label>
        ) : (
          <span />
        )}

        <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
          <MagnifyingGlass size={20} weight="bold" aria-hidden />
          {busy ? "Buscando…" : "Buscar lojas"}
        </Button>
      </div>
    </form>
  );
}
