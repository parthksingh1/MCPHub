'use client';

import { CATEGORIES, CATEGORY_LABELS } from '@mcphub/shared';
import { Command } from 'cmdk';
import { ArrowRight, Box, Layers, Search, Send, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/** A search hit as returned by `/api/search`. */
interface SearchHit {
  slug: string;
  name: string;
  description: string;
  trustTotal: number;
}

/** Static destinations always offered, regardless of the query. */
const PAGES = [
  { label: 'Browse all servers', href: '/servers', Icon: Box },
  { label: 'Submit a server', href: '/submit', Icon: Send },
  { label: 'How the Trust Score works', href: '/trust-score', Icon: ShieldCheck },
] as const;

/** How long to wait after the last keystroke before querying. */
const DEBOUNCE_MS = 180;

/**
 * The ⌘K command palette.
 *
 * MCPHub's signature interaction, so it has to feel instant. Three things make
 * it so: the query is debounced rather than fired per keystroke, an in-memory
 * map caches every term already typed (backspacing is then free), and requests
 * are aborted when superseded so a slow response can never overwrite a newer
 * one.
 */
export function CommandPalette(): React.JSX.Element {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const cache = useRef(new Map<string, SearchHit[]>());
  const inFlight = useRef<AbortController | undefined>(undefined);

  // ⌘K / Ctrl-K opens; the dialog handles Escape itself.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const hit = cache.current.get(term);
    if (hit) {
      setResults(hit);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=8`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));

        const body = (await response.json()) as { results: SearchHit[] };
        cache.current.set(term, body.results);
        setResults(body.results);
      } catch (error) {
        // An abort is the expected outcome of typing another character, not a
        // failure worth surfacing.
        if (!(error instanceof DOMException && error.name === 'AbortError')) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router],
  );

  const matchingCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return CATEGORIES.slice(0, 5);

    return CATEGORIES.filter((slug) => CATEGORY_LABELS[slug].toLowerCase().includes(term)).slice(
      0,
      5,
    );
  }, [query]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search MCPHub"
      // cmdk filters client-side by default; our results are already ranked by
      // Postgres, and re-filtering them would drop legitimate fuzzy matches.
      shouldFilter={false}
      className={cn(
        'fixed left-1/2 top-[20vh] z-50 w-[min(92vw,34rem)] -translate-x-1/2',
        'bg-surface shadow-card overflow-hidden rounded-lg border',
        'data-[state=open]:animate-fade-up',
      )}
    >
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="text-text-muted size-4 shrink-0" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search servers, categories, pages…"
          className="placeholder:text-text-muted h-11 w-full bg-transparent text-sm outline-none"
        />
        <kbd className="text-text-muted hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:block">
          ESC
        </kbd>
      </div>

      <Command.List className="max-h-[min(24rem,50vh)] overflow-y-auto p-2">
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <Command.Empty className="text-text-muted px-3 py-8 text-center text-sm">
            No servers match “{query.trim()}”.
          </Command.Empty>
        )}

        {loading && (
          <div className="space-y-1 p-1" aria-live="polite" aria-busy="true">
            <span className="sr-only">Searching…</span>
            {[0, 1, 2].map((index) => (
              <div key={index} className="bg-surface-hover h-11 animate-pulse rounded-md" />
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <Command.Group
            heading="Servers"
            className="[&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
          >
            {results.map((server) => (
              <Command.Item
                key={server.slug}
                value={server.slug}
                onSelect={() => go(`/servers/${server.slug}`)}
                className="data-[selected=true]:bg-surface-hover flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm"
              >
                <Box className="text-text-muted size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{server.name}</span>
                  <span className="text-text-muted block truncate text-xs">
                    {server.description}
                  </span>
                </span>
                <span className="text-text-muted shrink-0 font-mono text-xs tabular-nums">
                  {server.trustTotal}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {matchingCategories.length > 0 && (
          <Command.Group
            heading="Categories"
            className="[&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
          >
            {matchingCategories.map((slug) => (
              <Command.Item
                key={slug}
                value={`category-${slug}`}
                onSelect={() => go(`/categories/${slug}`)}
                className="data-[selected=true]:bg-surface-hover flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm"
              >
                <Layers className="text-text-muted size-4 shrink-0" aria-hidden />
                {CATEGORY_LABELS[slug]}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group
          heading="Go to"
          className="[&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
        >
          {PAGES.map(({ label, href, Icon }) => (
            <Command.Item
              key={href}
              value={label}
              onSelect={() => go(href)}
              className="data-[selected=true]:bg-surface-hover flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm"
            >
              <Icon className="text-text-muted size-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              <ArrowRight className="text-text-muted size-3.5" aria-hidden />
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
