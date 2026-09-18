import { Breadcrumbs, type Crumb } from '@/components/breadcrumbs';
import { cn } from '@/lib/utils';

/** Props for {@link PageHeader}. */
export interface PageHeaderProps {
  /** Trail below Home; the last item is the current page. */
  crumbs: Crumb[];
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions, e.g. a primary button. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The standard top of every inner page: breadcrumbs, eyebrow, title, one-line
 * intro. One component so every page opens the same way — the rhythm is what
 * makes a site feel designed rather than assembled.
 */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className={className}>
      <Breadcrumbs items={crumbs} />
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1
            className={cn('text-3xl font-semibold tracking-tight sm:text-4xl', eyebrow && 'mt-2')}
          >
            {title}
          </h1>
          {description && (
            <p className="text-text-secondary mt-3 max-w-prose leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    </div>
  );
}
