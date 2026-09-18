'use client';

import {
  CATEGORY_LABELS,
  LANGUAGES,
  MCP_CLIENTS,
  MCP_CLIENT_LABELS,
  type CategoryCount,
} from '@mcphub/shared';
import { SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORY_STYLE } from '@/lib/category-style';
import { cn } from '@/lib/utils';

/** Props for {@link BrowseFilters}. */
export interface BrowseFiltersProps {
  categories: CategoryCount[];
  /** Total results for the current filter set, shown in the mobile summary. */
  total: number;
}

/**
 * The browse page's filter panel.
 *
 * All state lives in the URL rather than in React. That makes every filter
 * combination a shareable, bookmarkable, server-rendered page — which matters
 * for SEO, for the back button behaving sensibly, and for the free tier, since
 * a distinct URL is a distinct cache entry at the edge.
 */
export function BrowseFilters({ categories, total }: BrowseFiltersProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const selectedCategories = params.getAll('category');
  const selectedClients = params.getAll('client');
  const language = params.get('language') ?? '';
  const minTrust = Number.parseInt(params.get('minTrust') ?? '0', 10);
  const verifiedOnly = params.get('verified') === 'true';
  const officialOnly = params.get('official') === 'true';

  const activeCount =
    selectedCategories.length +
    selectedClients.length +
    (language ? 1 : 0) +
    (minTrust > 0 ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (officialOnly ? 1 : 0);

  /**
   * Applies a change to the query string.
   *
   * Always resets to page 1: staying on page 7 after narrowing the results to
   * three items shows an empty grid, which reads as a broken filter.
   */
  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete('page');

      startTransition(() => {
        router.push(next.size > 0 ? `${pathname}?${next}` : pathname, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const toggleMulti = (key: string, value: string): void =>
    update((next) => {
      const current = next.getAll(key);
      next.delete(key);

      for (const item of current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]) {
        next.append(key, item);
      }
    });

  const setSingle = (key: string, value: string): void =>
    update((next) => (value ? next.set(key, value) : next.delete(key)));

  const clearAll = (): void =>
    update((next) => {
      for (const key of ['category', 'client', 'language', 'minTrust', 'verified', 'official']) {
        next.delete(key);
      }
    });

  return (
    <>
      {/* Mobile trigger */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <Button variant="secondary" size="sm" onClick={() => setOpenOnMobile((value) => !value)}>
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && <Badge variant="accent">{activeCount}</Badge>}
        </Button>
        <span className="text-text-muted text-sm tabular-nums">{total} servers</span>
      </div>

      <aside
        aria-label="Filters"
        className={cn(
          'space-y-6 lg:block',
          openOnMobile
            ? 'bg-surface mt-4 block rounded-lg border p-4 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0'
            : 'hidden',
          pending && 'opacity-60 transition-opacity',
        )}
      >
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-text-muted hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
          >
            <X className="size-3" aria-hidden />
            Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
          </button>
        )}

        {/* Categories */}
        <fieldset>
          <legend className="text-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
            Category
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {categories
              .filter((category) => category.count > 0)
              .map((category) => {
                const active = selectedCategories.includes(category.slug);

                return (
                  <button
                    key={category.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleMulti('category', category.slug)}
                    className={cn(
                      'rounded-sm border px-2 py-1 text-xs transition-colors duration-200',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'text-text-secondary hover:border-hover hover:bg-surface-hover',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mr-1.5 inline-block size-1.5 rounded-full align-middle',
                        CATEGORY_STYLE[category.slug].dot,
                      )}
                    />
                    {CATEGORY_LABELS[category.slug]}
                    <span className="ml-1.5 tabular-nums opacity-60">{category.count}</span>
                  </button>
                );
              })}
          </div>
        </fieldset>

        {/* Client compatibility */}
        <fieldset>
          <legend className="text-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
            Works with
          </legend>
          <div className="space-y-1.5">
            {MCP_CLIENTS.map((client) => (
              <label
                key={client}
                className="text-text-secondary flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client)}
                  onChange={() => toggleMulti('client', client)}
                  className="checkbox-accent"
                />
                {MCP_CLIENT_LABELS[client]}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Language */}
        <div>
          <label
            htmlFor="filter-language"
            className="text-text-muted mb-2 block text-xs font-medium uppercase tracking-wide"
          >
            Language
          </label>
          <select
            id="filter-language"
            value={language}
            onChange={(event) => setSingle('language', event.target.value)}
            className="bg-surface hover:border-hover h-9 w-full rounded-md border px-2 text-sm capitalize transition-colors"
          >
            <option value="">Any language</option>
            {LANGUAGES.map((option) => (
              <option key={option} value={option} className="capitalize">
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Trust Score */}
        <div>
          <label
            htmlFor="filter-trust"
            className="text-text-muted mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide"
          >
            Min Trust Score
            <span className="text-text-secondary font-mono tabular-nums">{minTrust}</span>
          </label>
          <input
            id="filter-trust"
            type="range"
            min={0}
            max={100}
            step={5}
            value={minTrust}
            onChange={(event) =>
              setSingle('minTrust', event.target.value === '0' ? '' : event.target.value)
            }
            className="range-accent"
          />
        </div>

        {/* Flags */}
        <fieldset className="space-y-1.5">
          <legend className="text-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
            Trust
          </legend>
          <label className="text-text-secondary flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={() => setSingle('verified', verifiedOnly ? '' : 'true')}
              className="checkbox-accent"
            />
            Verified only
          </label>
          <label className="text-text-secondary flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={officialOnly}
              onChange={() => setSingle('official', officialOnly ? '' : 'true')}
              className="checkbox-accent"
            />
            Official publishers only
          </label>
        </fieldset>
      </aside>
    </>
  );
}
