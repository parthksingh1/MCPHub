import { Skeleton } from '@/components/ui/skeleton';

/** Server detail placeholder: title block, score, then content and sidebar. */
export default function Loading(): React.JSX.Element {
  return (
    <main className="container py-8" aria-busy="true">
      <span className="sr-only">Loading server…</span>
      <Skeleton className="h-4 w-40" />
      <div className="mt-6 flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Skeleton className="size-14 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
        </div>
        <Skeleton className="hidden size-20 shrink-0 rounded-full sm:block" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
