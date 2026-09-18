import Link from 'next/link';

import { TrustPill } from '@/components/trust-pill';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SponsorRow } from '@/lib/queries/spotlight';
import { cn } from '@/lib/utils';

/** Props for {@link SponsoredStrip}. */
export interface SponsoredStripProps {
  sponsors: SponsorRow[];
  className?: string;
}

/**
 * The homepage Spotlight strip.
 *
 * Visually separate from every ranked list on purpose: its own dashed frame,
 * a "Sponsored" label that is always visible, the server's real Trust Score
 * beside it, and `rel="sponsored"` on every link. Renders nothing when empty —
 * no "your ad here" filler.
 */
export function SponsoredStrip({
  sponsors,
  className,
}: SponsoredStripProps): React.JSX.Element | null {
  if (sponsors.length === 0) return null;

  return (
    <aside
      aria-label="Sponsored servers"
      className={cn('rounded-2xl border border-dashed p-4 sm:p-5', className)}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Sponsored</p>
        <Link
          href="/spotlight"
          className="text-text-muted hover:text-foreground text-xs underline-offset-2 hover:underline"
        >
          About Spotlight
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {sponsors.map((sponsor) => (
          <li key={sponsor.slug}>
            <Link
              href={`/servers/${sponsor.slug}`}
              rel="sponsored"
              className="bg-surface hover:bg-surface-hover hover:border-hover flex items-center gap-3 rounded-xl border p-3 transition-colors"
            >
              <Avatar className="size-9">
                {sponsor.authorAvatar && <AvatarImage src={sponsor.authorAvatar} alt="" />}
                <AvatarFallback>{sponsor.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{sponsor.name}</span>
                <span className="text-text-muted block truncate text-xs">
                  {sponsor.description}
                </span>
              </span>
              <TrustPill score={sponsor.trustTotal} />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
