'use client';

import {
  CATEGORY_LABELS,
  LANGUAGES,
  MCP_CLIENTS,
  MCP_CLIENT_LABELS,
  type Category,
  type CategoryCount,
  type McpClient,
} from '@mcphub/shared';
import { SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CATEGORY_ICON } from '@/lib/category-icons';
import { languageLabel } from '@/lib/language-colors';
import { cn } from '@/lib/utils';

/** Filter keys that live in the Filters panel (categories have their own row). */
const PANEL_KEYS = ['client', 'language', 'minTrust', 'verified', 'official'] as const;

/** Minimum Trust Score presets — one tap instead of a fiddly slider. */
const TRUST_PRESETS = [
  { value: '', label: 'Any' },
  { value: '50', label: '50+' },
  { value: '75', label: '75+' },
  { value: '90', label: '90+' },
] as const;

/** Sort options surfaced as tabs; the rest stay reachable by URL. */
const SORTS = [
  { value: 'trust', label: 'Top rated' },
  { value: 'stars', label: 'Most stars' },
  { value: 'recent', label: 'Newest' },
  { value: 'updated', label: 'Recently updated' },
] as const;

/**
 * Reads and writes the browse query string.
 *
 * All state lives in the URL: every combination is shareable, server-rendered
 * and cacheable, and the back button behaves. Any change resets to page 1 —
 * staying on page 7 of a narrower result set shows an empty grid.
 */
function useQueryState(): {
  params: URLSearchParams;
  pending: boolean;
  update: (mutate: (next: URLSearchParams) => void) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const params = new URLSearchParams(search.toString());

  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(search.toString());
      mutate(next);
      next.delete('page');
      startTransition(() => {
        router.push(next.size > 0 ? `${pathname}?${next}` : pathname, { scroll: false });
      });
    },
    [search, pathname, router],
  );

  return { params, pending, update };
}

/** Adds `value` to a multi-value key, or removes it if present. */
function toggle(next: URLSearchParams, key: string, value: string): void {
  const current = next.getAll(key);
  next.delete(key);
  const updated = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  for (const item of updated) next.append(key, item);
}

/** A small selectable chip used throughout the controls. */
function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'bg-surface text-text-secondary hover:border-hover hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * The category row: every category one tap away, scrolling sideways on small
 * screens rather than wrapping into a wall of chips.
 */
export function CategoryPills({ categories }: { categories: CategoryCount[] }): React.JSX.Element {
  const { params, update } = useQueryState();
  const selected = params.getAll('category');

  return (
    <div
      role="group"
      aria-label="Filter by category"
      // One row that scrolls sideways, fading at the right edge, instead of a
      // three-row wall of chips.
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,black_calc(100%-48px),transparent)] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <Chip
        active={selected.length === 0}
        onClick={() => update((next) => next.delete('category'))}
      >
        All
      </Chip>
      {categories
        .filter((category) => category.count > 0)
        .map((category) => {
          const Icon = CATEGORY_ICON[category.slug];
          const active = selected.includes(category.slug);
          return (
            <Chip
              key={category.slug}
              active={active}
              onClick={() => update((next) => toggle(next, 'category', category.slug))}
            >
              <Icon className="size-4 opacity-70" aria-hidden />
              {CATEGORY_LABELS[category.slug]}
              <span className={cn('text-xs tabular-nums', active ? 'opacity-70' : 'opacity-50')}>
                {category.count.toLocaleString()}
              </span>
            </Chip>
          );
        })}
    </div>
  );
}

/** Sort as a segmented control: every option visible, one click to change. */
export function SortTabs(): React.JSX.Element {
  const { params, pending, update } = useQueryState();
  const current = params.get('sort') ?? 'trust';

  return (
    <div
      role="radiogroup"
      aria-label="Sort servers"
      className={cn(
        'bg-surface inline-flex max-w-full overflow-x-auto rounded-lg border p-0.5 [scrollbar-width:none]',
        pending && 'opacity-60',
      )}
    >
      {SORTS.map((sort) => {
        const active = current === sort.value;
        return (
          <button
            key={sort.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() =>
              update((next) =>
                sort.value === 'trust' ? next.delete('sort') : next.set('sort', sort.value),
              )
            }
            className={cn(
              'h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-md px-3 text-sm transition-colors',
              active
                ? 'bg-background text-foreground font-medium shadow-sm'
                : 'text-text-muted hover:text-foreground',
            )}
          >
            {sort.label}
          </button>
        );
      })}
    </div>
  );
}

/** A titled section inside the Filters panel. */
function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * The secondary filters, in a side panel rather than a crowded sidebar.
 *
 * Every option is a chip: nothing to open, no slider to nudge. Changes apply
 * immediately, so the grid behind the panel updates as you choose.
 */
export function FilterSheet({ total }: { total: number }): React.JSX.Element {
  const { params, update } = useQueryState();

  const clients = params.getAll('client');
  const language = params.get('language') ?? '';
  const minTrust = params.get('minTrust') ?? '';
  const verified = params.get('verified') === 'true';
  const official = params.get('official') === 'true';

  const activeCount =
    clients.length +
    (language ? 1 : 0) +
    (minTrust ? 1 : 0) +
    (verified ? 1 : 0) +
    (official ? 1 : 0);

  const clear = (): void =>
    update((next) => {
      for (const key of PANEL_KEYS) next.delete(key);
    });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" className="h-11 shrink-0 rounded-xl px-4">
          <SlidersHorizontal className="size-4" aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="bg-foreground text-background inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[92vw] max-w-md flex-col gap-0 p-0">
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <SheetTitle className="text-base">Filters</SheetTitle>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          <PanelSection title="Works with">
            {MCP_CLIENTS.map((client: McpClient) => (
              <Chip
                key={client}
                active={clients.includes(client)}
                onClick={() => update((next) => toggle(next, 'client', client))}
              >
                {MCP_CLIENT_LABELS[client]}
              </Chip>
            ))}
          </PanelSection>

          <PanelSection title="Minimum Trust Score">
            {TRUST_PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                active={minTrust === preset.value}
                onClick={() =>
                  update((next) =>
                    preset.value ? next.set('minTrust', preset.value) : next.delete('minTrust'),
                  )
                }
              >
                {preset.label}
              </Chip>
            ))}
          </PanelSection>

          <PanelSection title="Language">
            <Chip active={!language} onClick={() => update((next) => next.delete('language'))}>
              Any
            </Chip>
            {LANGUAGES.map((option) => (
              <Chip
                key={option}
                active={language === option}
                onClick={() => update((next) => next.set('language', option))}
              >
                {languageLabel(option)}
              </Chip>
            ))}
          </PanelSection>

          <PanelSection title="Publisher">
            <Chip
              active={verified}
              onClick={() =>
                update((next) =>
                  verified ? next.delete('verified') : next.set('verified', 'true'),
                )
              }
            >
              Verified only
            </Chip>
            <Chip
              active={official}
              onClick={() =>
                update((next) =>
                  official ? next.delete('official') : next.set('official', 'true'),
                )
              }
            >
              Official publishers only
            </Chip>
          </PanelSection>
        </div>

        <div className="flex items-center gap-3 border-t p-4">
          <Button variant="ghost" onClick={clear} disabled={activeCount === 0}>
            Clear filters
          </Button>
          <SheetClose asChild>
            <Button className="ml-auto">Show {total.toLocaleString()} servers</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Every active filter as a removable chip, so nothing is applied invisibly. */
export function ActiveFilters(): React.JSX.Element | null {
  const { params, update } = useQueryState();

  const chips: { key: string; value: string; label: string }[] = [
    ...params.getAll('category').map((value) => ({
      key: 'category',
      value,
      label: CATEGORY_LABELS[value as Category] ?? value,
    })),
    ...params.getAll('client').map((value) => ({
      key: 'client',
      value,
      label: MCP_CLIENT_LABELS[value as McpClient] ?? value,
    })),
  ];
  const language = params.get('language');
  if (language) chips.push({ key: 'language', value: language, label: languageLabel(language) });
  const minTrust = params.get('minTrust');
  if (minTrust) chips.push({ key: 'minTrust', value: minTrust, label: `Trust ${minTrust}+` });
  if (params.get('verified') === 'true')
    chips.push({ key: 'verified', value: 'true', label: 'Verified' });
  if (params.get('official') === 'true')
    chips.push({ key: 'official', value: 'true', label: 'Official' });
  const q = params.get('q');
  if (q) chips.push({ key: 'q', value: q, label: `“${q}”` });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          type="button"
          onClick={() =>
            update((next) => {
              const rest = next.getAll(chip.key).filter((item) => item !== chip.value);
              next.delete(chip.key);
              for (const item of rest) next.append(chip.key, item);
            })
          }
          className="bg-surface-hover hover:bg-surface inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border pl-3 pr-2 text-xs font-medium capitalize transition-colors"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <X className="size-3.5 opacity-60" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          update((next) => {
            for (const key of ['category', 'q', ...PANEL_KEYS]) next.delete(key);
          })
        }
        className="text-text-muted hover:text-foreground cursor-pointer px-1 text-xs underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
