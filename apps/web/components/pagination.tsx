import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { pageWindow } from '@/lib/pagination';
import { cn } from '@/lib/utils';

/** Props for {@link Pagination}. */
export interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the link for a page number, keeping the current filters. */
  hrefFor: (page: number) => string;
  className?: string;
}

const ITEM =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm tabular-nums transition-colors';

/**
 * Numbered pagination with Previous and Next.
 *
 * Real links, so every page is shareable, crawlable and works with the back
 * button — and you can always see where you are.
 */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  className,
}: PaginationProps): React.JSX.Element | null {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      {hasPrevious ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={cn(ITEM, 'hover:bg-surface-hover gap-1 border')}
        >
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Previous</span>
          <span className="sr-only sm:hidden">Previous page</span>
        </Link>
      ) : (
        <span aria-disabled className={cn(ITEM, 'text-text-muted gap-1 border opacity-50')}>
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      <ul className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="text-text-muted px-1 text-sm">
              …
            </li>
          ) : (
            <li key={item} className={item === page ? '' : 'hidden sm:block'}>
              <Link
                href={hrefFor(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  ITEM,
                  item === page
                    ? 'bg-foreground text-background font-semibold'
                    : 'text-text-secondary hover:bg-surface-hover',
                )}
              >
                {item.toLocaleString()}
              </Link>
            </li>
          ),
        )}
      </ul>

      {hasNext ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={cn(ITEM, 'hover:bg-surface-hover gap-1 border')}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sr-only sm:hidden">Next page</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span aria-disabled className={cn(ITEM, 'text-text-muted gap-1 border opacity-50')}>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
