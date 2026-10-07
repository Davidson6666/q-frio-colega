import { MapPin, Star } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import {
  OPPORTUNITY_LEVEL_META,
  WEBSITE_STATUS_META,
  levelFromScore,
  type WebsiteStatus,
} from "@/lib/analysis/labels";
import { cn } from "@/lib/utils";

export interface OpportunityCardData {
  name: string;
  address: string;
  rating: number;
  reviewsCount: number;
  websiteStatus: WebsiteStatus;
  score: number;
  suggestedOffer: string;
}

/**
 * One business with its diagnosis and the suggested offer.
 * Built as the real search-result card (reused in Phase 3) and also used as the
 * landing page hero visual, so the product preview is the product itself.
 *
 * Double-bezel: an outer shell holds an inner core with concentric radii.
 */
export function OpportunityCard({
  business,
  className,
}: {
  business: OpportunityCardData;
  className?: string;
}) {
  const status = WEBSITE_STATUS_META[business.websiteStatus];
  const level = OPPORTUNITY_LEVEL_META[levelFromScore(business.score)];

  return (
    <article
      className={cn(
        "rounded-[1.75rem] bg-foreground/[0.04] p-1.5 ring-1 ring-line",
        className,
      )}
    >
      <div className="rounded-[calc(1.75rem-0.375rem)] bg-surface p-5 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {business.name}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin size={16} weight="light" className="shrink-0" aria-hidden />
              <span className="truncate">{business.address}</span>
            </p>
          </div>
          <span className="font-mono text-2xl font-medium tabular-nums text-accent-ink">
            {business.score}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone={level.tone}>{level.label}</Badge>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
          <Star size={16} weight="fill" className="text-warn" aria-hidden />
          <span className="font-medium text-foreground">
            {business.rating.toFixed(1).replace(".", ",")}
          </span>
          <span>({business.reviewsCount} avaliações)</span>
        </p>

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs text-muted">O que oferecer</p>
          <p className="mt-1 text-sm font-medium">{business.suggestedOffer}</p>
        </div>
      </div>
    </article>
  );
}
