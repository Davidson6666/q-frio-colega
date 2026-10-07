"use client";

import { useMemo, useRef, useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { CheckResponse } from "@/app/api/check/route";
import type { SearchResponse } from "@/app/api/search/route";
import type { ResultStatus } from "@/lib/analysis/labels";
import { STATUS_ORDER } from "@/lib/analysis/labels";
import type { CheckResult } from "@/lib/analysis/website-check";
import { useContacted } from "@/lib/hooks/use-contacted";
import { buildCsv, csvFileName } from "@/lib/search/csv";
import { sortResults } from "@/lib/search/sort";
import type { ResultItem, SortKey } from "@/lib/search/types";
import { Filters } from "./filters";
import { ResultCard } from "./result-card";
import { SearchForm, type SearchInput } from "./search-form";

type Phase = "idle" | "searching" | "checking" | "done" | "error";

// Sites are checked in small batches, a few batches at a time: each request
// stays short and cards update progressively instead of all at once at the end.
const BATCH_SIZE = 4;
const CONCURRENCY = 3;

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

export function SearchTool() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [fetched, setFetched] = useState(0);
  const [query, setQuery] = useState<SearchInput | null>(null);
  const [pendingTotal, setPendingTotal] = useState(0);
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
      const data = await postJson<SearchResponse>("/api/search", input, current.signal);
      if (current.signal.aborted) return;

      setResults(data.results);
      setFetched(data.fetched);

      const pending = data.results.filter((item) => item.status === "CHECKING");
      setPendingTotal(pending.length);

      if (pending.length === 0) {
        setPhase("done");
        return;
      }
      setPhase("checking");
      await runChecks(pending, current.signal);
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

  const visible = useMemo(() => {
    const filtered = selected.size === 0 ? results : results.filter((item) => selected.has(item.status));
    return sortResults(filtered, sort);
  }, [results, selected, sort]);

  const stillChecking = counts.CHECKING;

  function toggleStatus(status: ResultStatus) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(status)) next.delete(status);
      else next.add(status);
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
      <SearchForm busy={phase === "searching"} onSearch={handleSearch} />

      {phase === "error" ? <FormAlert error={error} /> : null}

      {phase === "searching" ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-live="polite">
          <span className="sr-only">Buscando lojas…</span>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-60 rounded-[1.75rem]" />
          ))}
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

      {phase === "checking" || phase === "done" ? (
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
                  {query.niche} em {query.city}, {query.uf}
                  {query.onlyCity && fetched > results.length
                    ? `. O Google devolveu ${fetched}; ${fetched - results.length} ficaram fora da cidade.`
                    : ""}
                </p>
              ) : null}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={downloadCsv}
              disabled={visible.length === 0 || stillChecking > 0}
              className="gap-2"
            >
              <DownloadSimple size={18} weight="regular" aria-hidden />
              Exportar CSV ({visible.length})
            </Button>
          </div>

          {phase === "checking" ? (
            <div className="grid gap-2" aria-live="polite">
              <p className="text-sm text-muted">
                Verificando sites: {pendingTotal - stillChecking} de {pendingTotal}…
              </p>
              <progress
                value={pendingTotal - stillChecking}
                max={pendingTotal}
                className="h-2 w-full"
                aria-label="Progresso da verificação dos sites"
              />
            </div>
          ) : null}

          {results.length > 0 ? (
            <Filters
              counts={counts}
              selected={selected}
              onToggle={toggleStatus}
              onClear={() => setSelected(new Set())}
              sort={sort}
              onSort={setSort}
            />
          ) : null}

          {results.length === 0 ? (
            <div className="rounded-card border border-dashed border-field p-8">
              <p className="font-medium">Nenhuma loja encontrada</p>
              <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted">
                Tente outro tipo de loja (por exemplo, &quot;salão de beleza&quot; em vez de
                &quot;cabeleireiro&quot;) ou desmarque &quot;Só lojas dentro da cidade&quot;.
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
                  contacted={contacted.has(item.id)}
                  onToggleContacted={toggle}
                />
              ))}
            </div>
          )}

          {fetched >= 60 && phase === "done" ? (
            <p className="max-w-[70ch] text-sm leading-relaxed text-muted">
              O Google entrega no máximo 60 resultados por busca. Para cobrir mais lojas, repita
              a busca com variações do tipo de loja ou com cidades vizinhas.
            </p>
          ) : null}
        </section>
      ) : null}

      <details className="rounded-card border border-line bg-surface p-5 text-sm">
        <summary className="cursor-pointer font-medium">Como cada situação é decidida</summary>
        <dl className="mt-4 grid gap-3 leading-relaxed">
          <Definition term="Sem site">O Google não tem nenhum site cadastrado para a loja.</Definition>
          <Definition term="Só rede social">
            O link cadastrado é Instagram, Facebook, WhatsApp, Linktree, iFood ou similar, e não um
            site próprio.
          </Definition>
          <Definition term="Site com problema">
            O endereço não abre: domínio que não existe, servidor que recusa conexão, página
            inexistente (404), erro do servidor (500), certificado vencido ou de outro domínio, ou
            loop de redirecionamento.
          </Definition>
          <Definition term="Site lento">Demora mais de 4 segundos para começar a responder.</Definition>
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
