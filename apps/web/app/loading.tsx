import { Skeleton } from '@/components/ui/skeleton';

/**
 * Fallback shown the moment a link is clicked, while the next page renders.
 *
 * Without a loading boundary the old page just sits there until the new one
 * is ready, which reads as a dead click and invites a second one.
 */
export default function Loading(): React.JSX.Element {
  return (
    <main className="container py-8" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-9 w-full max-w-md" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
