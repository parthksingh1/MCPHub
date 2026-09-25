'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Input } from '@/components/ui/input';

/**
 * The browse page's search box.
 *
 * Debounced before it touches the URL: pushing a route on every keystroke
 * would fill the history stack with a dozen entries the back button then has
 * to walk through one character at a time.
 */
export function SearchInput(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const urlQuery = params.get('q') ?? '';
  const [value, setValue] = useState(urlQuery);

  // Keep in step when the URL changes from elsewhere (back button, a chip).
  useEffect(() => setValue(urlQuery), [urlQuery]);

  useEffect(() => {
    if (value === urlQuery) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());

      if (value.trim()) next.set('q', value.trim());
      else next.delete('q');

      next.delete('page');

      startTransition(() => {
        router.replace(next.size > 0 ? `${pathname}?${next}` : pathname, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [value, urlQuery, params, pathname, router]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        className="text-text-muted pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by name, tool or integration…"
        aria-label="Search servers"
        className="bg-surface h-11 rounded-xl pl-11 pr-10 text-base shadow-sm md:text-[15px]"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Clear search"
          className="text-text-muted hover:text-foreground absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
      <span aria-live="polite" className="sr-only">
        {pending ? 'Searching' : ''}
      </span>
    </div>
  );
}
