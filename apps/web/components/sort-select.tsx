'use client';

import { SORT_OPTIONS, type SortOption } from '@mcphub/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

/** Human-readable label for each sort option. */
const LABELS: Record<SortOption, string> = {
  trust: 'Trust Score',
  stars: 'Most stars',
  recent: 'Recently added',
  updated: 'Recently updated',
  rating: 'Highest rated',
  name: 'Name (A–Z)',
};

/** The browse page's sort control, synced to the `sort` query param. */
export function SortSelect(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = params.get('sort') ?? 'trust';

  const onChange = (value: string): void => {
    const next = new URLSearchParams(params.toString());

    if (value === 'trust') next.delete('sort');
    else next.set('sort', value);

    next.delete('page');

    startTransition(() => {
      router.push(next.size > 0 ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  };

  return (
    <label className="text-text-muted flex items-center gap-2 text-sm">
      <span className="sr-only sm:not-sr-only">Sort by</span>
      <select
        value={current}
        onChange={(event) => onChange(event.target.value)}
        disabled={pending}
        className="bg-surface text-foreground hover:border-hover h-9 rounded-md border px-2 text-sm transition-colors disabled:opacity-60"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {LABELS[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
