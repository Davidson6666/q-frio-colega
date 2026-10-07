import {
  ArrowSquareOut,
  MapPin,
  MapTrifold,
  Phone,
  Star,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { classifyUrl } from "@/lib/analysis/classify-url";
import { STATUS_META } from "@/lib/analysis/labels";
import { whatsappUrl } from "@/lib/phone";
import type { ResultItem } from "@/lib/search/types";
import { cn } from "@/lib/utils";

const linkClass = buttonVariants({ variant: "secondary", size: "sm", className: "gap-1.5" });

/**
 * One store with its diagnosis. Double-bezel: an outer shell holds an inner
 * core with concentric radii.
 */
export function ResultCard({
  item,
  contacted,
  onToggleContacted,
}: {
  item: ResultItem;
  contacted: boolean;
  onToggleContacted: (id: string) => void;
}) {
  const status = STATUS_META[item.status];
  const checkboxId = `contacted-${item.id}`;
  const reviews = item.reviewsCount ?? 0;
  // Only http(s) links are rendered: a javascript: or data: URL must never become an href.
  const siteHref = item.websiteUrl && classifyUrl(item.websiteUrl) !== "invalid" ? item.websiteUrl : null;

  return (
    <article
      className={cn(
        "rounded-[1.75rem] bg-foreground/[0.04] p-1.5 ring-1 ring-line transition-opacity duration-300",
        contacted && "opacity-60",
      )}
    >
      <div className="flex h-full flex-col rounded-[calc(1.75rem-0.375rem)] bg-surface p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-base font-semibold leading-snug tracking-tight">
            {item.name}
          </h3>
          <Badge tone={status.tone} aria-live="polite">
            {status.label}
          </Badge>
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
          <MapPin size={16} weight="light" className="mt-0.5 shrink-0" aria-hidden />
          <span>{item.address}</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          {item.rating !== null ? (
            <span className="flex items-center gap-1.5 text-muted">
              <Star size={16} weight="fill" className="text-warn" aria-hidden />
              <span className="font-medium text-foreground">
                {item.rating.toFixed(1).replace(".", ",")}
              </span>
              <span>({reviews} avaliações)</span>
            </span>
          ) : (
            <span className="text-muted">Sem avaliações</span>
          )}
          {item.phone ? (
            <a
              href={`tel:${item.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
            >
              <Phone size={16} weight="light" aria-hidden />
              {item.phone}
            </a>
          ) : (
            <span className="text-muted">Sem telefone</span>
          )}
        </div>

        {item.check ? (
          <p className="mt-3 rounded-field bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed text-muted">
            <span className="font-medium text-foreground">Confira antes de abordar: </span>
            {item.check.reason}
            {item.check.httpStatus && !item.check.reason.includes(String(item.check.httpStatus))
              ? ` (HTTP ${item.check.httpStatus})`
              : ""}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {item.whatsapp ? (
            <a
              href={whatsappUrl(item.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <WhatsappLogo size={18} weight="regular" aria-hidden />
              WhatsApp
            </a>
          ) : null}
          {item.mapsUrl ? (
            <a href={item.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <MapTrifold size={18} weight="regular" aria-hidden />
              Mapa
            </a>
          ) : null}
          {siteHref ? (
            <a href={siteHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <ArrowSquareOut size={18} weight="regular" aria-hidden />
              Abrir site
            </a>
          ) : null}
        </div>

        <div className="mt-auto pt-5">
          <label
            htmlFor={checkboxId}
            className="flex cursor-pointer items-center gap-3 border-t border-line pt-4 text-sm"
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={contacted}
              onChange={() => onToggleContacted(item.id)}
              className="size-5 shrink-0 rounded-md"
            />
            Já entrei em contato
          </label>
        </div>
      </div>
    </article>
  );
}
