import { Skeleton } from '@/components/ui/skeleton';

/** Browse page placeholder: same header, filter column and card grid. */
export default function Loading(): React.JSX.Element {
  return (
    <main className="container py-8" aria-busy="true">
      <span className="sr-only">Loading servers…</span>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <div className="hidden space-y-6 lg:block">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full sm:w-44" />
          </div>
          <Skeleton className="mt-4 h-4 w-48" />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <Skeleton key={index} className="h-44 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
