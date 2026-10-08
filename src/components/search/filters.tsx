"use client";

import { STATUS_META, STATUS_ORDER, type ResultStatus } from "@/lib/analysis/labels";
import { SORT_LABELS, type SortKey } from "@/lib/search/types";
import { inputClassName } from "@/components/ui/fields";
import { cn } from "@/lib/utils";

/** Statuses a user can filter by ("checking" is transient and never a filter). */
const FILTERABLE = STATUS_ORDER.filter((s) => s !== "CHECKING");

/** "No website of their own": nothing at all, or only a social/booking page. */
const NO_OWN_SITE: ResultStatus[] = ["NO_WEBSITE", "SOCIAL_ONLY"];

const RATING_SORTS: SortKey[] = ["rating", "reviews"];

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium",
        "transition-[background-color,border-color,color,transform] duration-300 ease-spring active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        active ? "border-accent bg-accent-soft text-accent-ink" : "border-field bg-surface hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

export function Filters({
  counts,
  selected,
  onToggle,
  onToggleMany,
  onClear,
  sort,
  onSort,
  hasRatings,
}: {
  counts: Record<ResultStatus, number>;
  selected: Set<ResultStatus>;
  onToggle: (status: ResultStatus) => void;
  onToggleMany: (statuses: ResultStatus[]) => void;
  onClear: () => void;
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  /** Whether the data source provides ratings; hides the sorts that need them. */
  hasRatings: boolean;
}) {
  const noOwnSiteCount = counts.NO_WEBSITE + counts.SOCIAL_ONLY;
  const noOwnSiteActive = NO_OWN_SITE.every((status) => selected.has(status));
  const sorts = (Object.keys(SORT_LABELS) as SortKey[]).filter(
    (key) => hasRatings || !RATING_SORTS.includes(key),
  );

  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Filtrar por situação do site" className="flex flex-wrap gap-2">
        <Chip
          active={noOwnSiteActive}
          disabled={noOwnSiteCount === 0 && !noOwnSiteActive}
          onClick={() => onToggleMany(NO_OWN_SITE)}
        >
          Sem site próprio
          <span className="font-mono text-xs tabular-nums opacity-80">{noOwnSiteCount}</span>
        </Chip>

        {FILTERABLE.map((status) => (
          <Chip
            key={status}
            active={selected.has(status)}
            disabled={counts[status] === 0 && !selected.has(status)}
            onClick={() => onToggle(status)}
          >
            {STATUS_META[status].label}
            <span className="font-mono text-xs tabular-nums opacity-80">{counts[status]}</span>
          </Chip>
        ))}

        {selected.size > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 rounded-full px-3 text-sm font-medium text-muted underline underline-offset-4 hover:text-foreground"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="sort" className="text-sm text-muted">
          Ordenar por
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(event) => onSort(event.target.value as SortKey)}
          className={cn(inputClassName, "h-11 w-auto min-w-52 py-0 text-sm")}
        >
          {sorts.map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
