import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { SITE_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

/** One step in a breadcrumb trail. The last item is the current page. */
export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail with BreadcrumbList structured data.
 *
 * Every page below the top level gets one, so "where am I and how do I get
 * back" always has an answer — and search results show the trail instead of a
 * bare URL.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}): React.JSX.Element {
  const trail: Crumb[] = [{ label: 'Home', href: '/' }, ...items];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${SITE_URL}${crumb.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ol className="text-text-muted flex flex-wrap items-center gap-1.5">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {crumb.href && !last ? (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className="text-text-secondary truncate"
                >
                  {crumb.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
