import { Skeleton } from "@/components/ui/skeleton";

/** Route-transition placeholder shaped like the dashboard. */
export default function Loading() {
  return (
    <div className="grid gap-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando...</span>
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-44 rounded-card lg:col-span-2" />
        <Skeleton className="h-44 rounded-card lg:col-span-3" />
      </div>
      <Skeleton className="h-36 rounded-card" />
    </div>
  );
}
