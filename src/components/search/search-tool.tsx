"use client";

import { useMemo, useRef, useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { CheckResponse } from "@/app/api/check/route";
import type { GuessResponse } from "@/app/api/guess/route";
import type { SearchResponse } from "@/app/api/search/route";
import { classifyUrl } from "@/lib/analysis/classify-url";
import type { ResultStatus } from "@/lib/analysis/labels";
import { STATUS_ORDER } from "@/lib/analysis/labels";
import type { CheckResult } from "@/lib/analysis/website-check";
import { useContacted } from "@/lib/hooks/use-contacted";
import type { PlacesSource } from "@/lib/places/types";
import { buildCsv, csvFileName } from "@/lib/search/csv";
import { sortResults } from "@/lib/search/sort";
import type { ResultItem, SortKey } from "@/lib/search/types";
import { Filters } from "./filters";
import { ResultCard } from "./result-card";
import { SearchForm, type SearchInput } from "./search-form";

type Phase = "idle" | "searching" | "checking" | "done" | "error";
type Meta = Omit<SearchResponse, "results">;

// Sites are checked in small batches, a few batches at a time: each request
// stays short and cards update progressively instead of all at once at the end.
const BATCH_SIZE = 4;
const CONCURRENCY = 3;
// Looking for a site by guessing domains is a few quick requests per store.
const GUESS_BATCH = 6;
const GUESS_CONCURRENCY = 3;

/** Stores with no site of their own in the data: the ones worth a second look. */
const needsGuess = (item: { status: ResultStatus }) =>
  item.status === "NO_WEBSITE" || item.status === "SOCIAL_ONLY";

const digitsOnly = (value: string | null) => (value ?? "").replace(/\D/g, "").replace(/^55/, "");

const chunk = <T,>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

const emptyCounts = () =>
  Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<ResultStatus, number>;

const CHECK_FAILED: CheckResult = {
  status: "UNKNOWN",
  details: {
    httpStatus: null,
    ttfbMs: null,
    finalUrl: null,
    hasViewport: null,
    reason: "Não foi possível checar este site agora. Abra no navegador para confirmar.",
  },
};

async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok || !data) throw new Error(data?.error ?? "Algo deu errado. Tente de novo.");
  return data;
}

export function SearchTool({ source }: { source: PlacesSource }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [query, setQuery] = useState<SearchInput | null>(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [guessTotal, setGuessTotal] = useState(0);
  const [guessDone, setGuessDone] = useState(0);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<Set<ResultStatus>>(new Set());
  const [sort, setSort] = useState<SortKey>("promising");
  const { contacted, toggle } = useContacted();
  const controller = useRef<AbortController | null>(null);

  function applyChecks(map: Record<string, CheckResult>) {
    setResults((previous) =>
      previous.map((item) => {
        const check = item.websiteUrl ? map[item.websiteUrl] : undefined;
        return check ? { ...item, status: check.status, check: check.details } : item;
      }),
    );
  }

  async function runChecks(items: ResultItem[], signal: AbortSignal) {
    const urls = [...new Set(items.flatMap((item) => (item.websiteUrl ? [item.websiteUrl] : [])))];
    const batches = chunk(urls, BATCH_SIZE);
    let cursor = 0;

    async function worker() {
      while (cursor < batches.length && !signal.aborted) {
        const batch = batches[cursor++];
        let map: Record<string, CheckResult>;
        try {
          map = (await postJson<CheckResponse>("/api/check", { urls: batch }, signal)).results;
        } catch {
          if (signal.aborted) return;
          map = Object.fromEntries(batch.map((url) => [url, CHECK_FAILED]));
        }
        if (signal.aborted) return;
        applyChecks(map);
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker));
  }

  /**
   * Looks for a site that matches stores with none in the data. A hit never settles
   * anything: it only moves the store to "Possível site" so it can be double-checked.
   */
  async function runGuesses(items: ResultItem[], city: string, signal: AbortSignal) {
    const batches = chunk(items, GUESS_BATCH);
    let cursor = 0;

    async function worker() {
      while (cursor < batches.length && !signal.aborted) {
        const batch = batches[cursor++];
        let found: GuessResponse["results"] = {};
        try {
          found = (
            await postJson<GuessResponse>(
              "/api/guess",
              {
                city,
                stores: batch.map((item) => ({
                  id: item.id,
                  name: item.name,
                  phones: [digitsOnly(item.phone), digitsOnly(item.whatsapp)].filter((phone) => phone.length >= 8),
                  socials: item.socials.slice(0, 4),
                })),
              },
              signal,
            )
          ).results;
        } catch {
          // A failed guess just means no hint for these stores. The list is still right.
          if (signal.aborted) return;
        }
        if (signal.aborted) return;

        setResults((previous) =>
          previous.map((item) => {
            const guess = found[item.id];
            // The card shows only plain own sites; never relabel a store without something to show.
            if (!guess || !needsGuess(item) || classifyUrl(guess.url) !== "own") return item;
            // Only strong evidence takes a store out of "no own site". A weak match (just
            // the page title) could be a namesake: wrongly hiding a lead costs more than
            // one extra check, so it stays listed and the card carries the warning.
            return guess.strength === "strong" ? { ...item, status: "POSSIBLE_SITE", guess } : { ...item, guess };
          }),
        );
        setGuessDone((done) => done + batch.length);
      }
    }

    await Promise.all(Array.from({ length: Math.min(GUESS_CONCURRENCY, batches.length) }, worker));
  }

  async function handleSearch(input: SearchInput) {
    controller.current?.abort(); // a new search replaces the previous one
    const current = new AbortController();
    controller.current = current;

    setPhase("searching");
    setError(undefined);
    setResults([]);
    setSelected(new Set());
    setQuery(input);

    try {
      const { results: found, ...rest } = await postJson<SearchResponse>("/api/search", input, current.signal);
      if (current.signal.aborted) return;

      setResults(found);
      setMeta(rest);
      // Ratings only exist for some sources: fall back from a sort that needs them.
      if (!found.some((item) => item.rating !== null)) {
        setSort((previous) => (previous === "rating" || previous === "reviews" ? "promising" : previous));
      }

      const pending = found.filter((item) => item.status === "CHECKING");
      const guessable = found.filter(needsGuess);
      setPendingTotal(pending.length);
      setGuessTotal(guessable.length);
      setGuessDone(0);

      if (pending.length === 0 && guessable.length === 0) {
        setPhase("done");
        return;
      }
      setPhase("checking");
      // Both kinds of lookup are independent, so they run side by side.
      await Promise.all([
        pending.length > 0 ? runChecks(pending, current.signal) : Promise.resolve(),
        guessable.length > 0 ? runGuesses(guessable, input.city, current.signal) : Promise.resolve(),
      ]);
      if (!current.signal.aborted) setPhase("done");
    } catch (caught) {
      if (current.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "Algo deu errado. Tente de novo.");
      setPhase("error");
    }
  }

  const counts = useMemo(() => {
    const next = emptyCounts();
    for (const item of results) next[item.status] += 1;
    return next;
  }, [results]);

  const hasRatings = useMemo(() => results.some((item) => item.rating !== null), [results]);

  const visible = useMemo(() => {
    const filtered = selected.size === 0 ? results : results.filter((item) => selected.has(item.status));
    return sortResults(filtered, sort);
  }, [results, selected, sort]);

  const stillChecking = counts.CHECKING;

  function toggleStatuses(statuses: ResultStatus[]) {
    setSelected((previous) => {
      const next = new Set(previous);
      const allOn = statuses.every((status) => next.has(status));
      for (const status of statuses) {
        if (allOn) next.delete(status);
        else next.add(status);
      }
      return next;
    });
  }

  function downloadCsv() {
    if (!query) return;
    const blob = new Blob([buildCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = csvFileName(query.city, query.uf, query.niche);
    link.click();
    // Some browsers start the download asynchronously: revoking right away can cancel it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="grid gap-8">
      <SearchForm source={source} busy={phase === "searching"} onSearch={handleSearch} />

      {phase === "error" ? <FormAlert error={error} /> : null}

      {phase === "searching" ? (
        <div className="grid gap-4" aria-busy="true" aria-live="polite">
          <p className="text-sm leading-relaxed text-muted">
            {source === "overture"
              ? "Buscando… A primeira busca em uma cidade baixa os dados dela e pode levar cerca de 1 minuto. As próximas buscas na mesma cidade são instantâneas."
              : "Buscando lojas…"}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-60 rounded-[1.75rem]" />
            ))}
          </div>
        </div>
      ) : null}

      {phase === "idle" ? (
        <div className="rounded-card border border-dashed border-field p-8 text-muted">
          <p className="font-medium text-foreground">Nenhuma busca ainda</p>
          <p className="mt-1 max-w-[60ch] leading-relaxed">
            Escolha o estado, a cidade e o tipo de loja. Os resultados mostram quais lojas não têm
            site, só têm rede social ou têm um site com problema.
          </p>
        </div>
      ) : null}

      {(phase === "checking" || phase === "done") && meta ? (
        <section aria-label="Resultados" className="grid gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div aria-live="polite">
              <h2 className="text-xl font-semibold tracking-tight">
                {visible.length === results.length
                  ? `${results.length} lojas`
                  : `${visible.length} de ${results.length} lojas`}
              </h2>
              {query ? (
                <p className="mt-1 text-sm text-muted">
                  {meta.nicheMatch?.kind === "category" ? meta.nicheMatch.label : query.niche} em{" "}
                  {query.city}, {query.uf}
                  {meta.source === "google" && query.onlyCity && meta.fetched !== undefined && meta.fetched > results.length
                    ? `. O Google devolveu ${meta.fetched}; ${meta.fetched - results.length} ficaram fora da cidade.`
                    : ""}
                  {meta.source === "overture" && meta.fetched !== undefined
                    ? `. ${meta.fetched} lugares com endereço nessa cidade nos dados.`
                    : ""}
                </p>
              ) : null}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={downloadCsv}
              disabled={visible.length === 0 || phase === "checking"}
              className="gap-2"
            >
              <DownloadSimple size={18} weight="regular" aria-hidden />
              Exportar CSV ({visible.length})
            </Button>
          </div>

          {meta.nicheMatch?.kind === "name" ? (
            <p className="rounded-field bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn">
              Esse tipo de loja não está na lista, então a busca procurou &quot;{meta.nicheMatch.label}&quot;
              no nome dos estabelecimentos. Escolha uma sugestão da lista para filtrar por categoria.
            </p>
          ) : null}

          {meta.matched > results.length ? (
            <p className="rounded-field bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn">
              Existem {meta.matched} lojas desse tipo nessa cidade. A lista mostra as {results.length} com
              os dados mais confiáveis. Para ver outras, busque um tipo de loja mais específico.
            </p>
          ) : null}

          {meta.truncated ? (
            <p className="rounded-field bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn">
              Essa cidade é muito grande e a lista é parcial: só os registros mais confiáveis foram
              carregados.
            </p>
          ) : null}

          {phase === "checking" ? (
            <div className="grid gap-2" aria-live="polite">
              <p className="text-sm text-muted">
                {pendingTotal > 0
                  ? `Verificando sites: ${pendingTotal - stillChecking} de ${pendingTotal}. `
                  : ""}
                {guessTotal > 0
                  ? `Procurando possíveis sites das lojas sem site: ${Math.min(guessDone, guessTotal)} de ${guessTotal}.`
                  : ""}
              </p>
              <progress
                value={pendingTotal - stillChecking + Math.min(guessDone, guessTotal)}
                max={pendingTotal + guessTotal}
                className="h-2 w-full"
                aria-label="Progresso da análise dos sites"
              />
            </div>
          ) : null}

          {results.length > 0 ? (
            <Filters
              counts={counts}
              selected={selected}
              onToggle={(status) => toggleStatuses([status])}
              onToggleMany={toggleStatuses}
              onClear={() => setSelected(new Set())}
              sort={sort}
              onSort={setSort}
              hasRatings={hasRatings}
            />
          ) : null}

          {results.length === 0 ? (
            <div className="rounded-card border border-dashed border-field p-8">
              <p className="font-medium">Nenhuma loja encontrada</p>
              <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted">
                {meta.source === "overture"
                  ? "Tente outro tipo de loja da lista de sugestões, ou um termo que apareça no nome do estabelecimento."
                  : "Tente outro tipo de loja (por exemplo, \"salão de beleza\" em vez de \"cabeleireiro\") ou desmarque \"Só lojas dentro da cidade\"."}
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-card border border-dashed border-field p-8">
              <p className="font-medium">Nenhuma loja com esses filtros</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => setSelected(new Set())}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visible.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  cityLabel={query ? `${query.city} ${query.uf}` : ""}
                  ratingsExpected={meta.source === "google"}
                  contacted={contacted.has(item.id)}
                  onToggleContacted={toggle}
                />
              ))}
            </div>
          )}

          {meta.source === "google" && (meta.fetched ?? 0) >= 60 && phase === "done" ? (
            <p className="max-w-[70ch] text-sm leading-relaxed text-muted">
              O Google entrega no máximo 60 resultados por busca. Para cobrir mais lojas, repita a
              busca com variações do tipo de loja ou com cidades vizinhas.
            </p>
          ) : null}

          {meta.source === "overture" ? (
            <p className="max-w-[75ch] text-sm leading-relaxed text-muted">
              Dados do Overture Maps (versão {meta.release}), atualizados todo mês. Alguns lugares
              podem ter fechado, e uma loja pode ter um site que não aparece nos dados: use o link
              &quot;Pesquisar&quot; para conferir antes de abordar.
            </p>
          ) : null}
        </section>
      ) : null}

      <details className="rounded-card border border-line bg-surface p-5 text-sm">
        <summary className="cursor-pointer font-medium">Como cada situação é decidida</summary>
        <dl className="mt-4 grid gap-3 leading-relaxed">
          <Definition term="Sem site">Nenhum site nem rede social cadastrados nos dados.</Definition>
          <Definition term="Só rede social">
            O único endereço conhecido é Instagram, Facebook, WhatsApp, Linktree, iFood, uma página de
            agendamento, um diretório ou o site da marca de uma franquia, e não um site próprio.
          </Definition>
          <Definition term="Possível site">
            A loja não tem site nos dados, mas um endereço montado a partir do nome responde com uma
            página que parece ser dela: o nome aparece junto com a cidade ou o telefone, ou a página
            liga para a rede social da própria loja. Fica marcado como possível, nunca como certo.
            Quando só o título da página bate com o nome, a evidência é fraca (pode ser uma empresa
            de mesmo nome): a loja continua em &quot;Sem site próprio&quot; e o cartão traz só um aviso.
          </Definition>
          <Definition term="Site institucional">
            O endereço é de um órgão público (escola estadual, prefeitura). Não é um cliente em
            potencial de site, então não é avaliado.
          </Definition>
          <Definition term="Site com problema">
            O endereço não abre: domínio que não existe, servidor que recusa conexão, página
            inexistente (404), erro do servidor (500), certificado vencido ou de outro domínio, ou
            loop de redirecionamento.
          </Definition>
          <Definition term="Site lento">
            Demora mais de 4 segundos para começar a responder, em duas medições.
          </Definition>
          <Definition term="Ruim no celular">
            Abre, mas a página não declara versão para telas pequenas.
          </Definition>
          <Definition term="Verificar manualmente">
            O site bloqueou o teste automático (comum em sites protegidos contra robôs) ou não
            respondeu. Nesses casos não dá para afirmar que está fora do ar, então abra no
            navegador antes de abordar.
          </Definition>
        </dl>
      </details>
    </div>
  );
}

function Definition({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium">{term}</dt>
      <dd className="text-muted">{children}</dd>
    </div>
  );
}
