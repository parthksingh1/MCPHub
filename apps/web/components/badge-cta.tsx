'use client';

import { getTrustBand } from '@mcphub/scoring';
import { useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { cn } from '@/lib/utils';

/** Props for {@link BadgeCta}. */
export interface BadgeCtaProps {
  slug: string;
  name: string;
  trustTotal: number;
  /** Canonical origin, passed from the server so it is correct in every env. */
  siteUrl: string;
  className?: string;
}

/** The snippet formats a maintainer might want. */
const FORMATS = [
  { id: 'markdown', label: 'Markdown' },
  { id: 'html', label: 'HTML' },
  { id: 'url', label: 'URL' },
] as const;

type FormatId = (typeof FORMATS)[number]['id'];

/**
 * Invites a maintainer to embed their Trust Score badge.
 *
 * This is the distribution loop, and it was the one piece of it that was
 * missing: the badge endpoint has existed since the API was built, but nothing
 * on the site ever told anyone it was there. A maintainer who scores well puts
 * the badge in their README, and every visitor to that repository sees MCPHub
 * — the same mechanic that grew Shields.io, except earned rather than bought.
 *
 * Shown only for servers scoring in the top two bands. Asking someone to
 * advertise a low score is both futile and slightly insulting.
 */
export function BadgeCta({
  slug,
  name,
  trustTotal,
  siteUrl,
  className,
}: BadgeCtaProps): React.JSX.Element | null {
  const [format, setFormat] = useState<FormatId>('markdown');

  if (getTrustBand(trustTotal) === 'low') return null;

  const badgeUrl = `${siteUrl}/api/badge/${slug}`;
  const pageUrl = `${siteUrl}/servers/${slug}`;

  const snippets: Record<FormatId, string> = {
    markdown: `[![MCPHub Trust Score](${badgeUrl})](${pageUrl})`,
    html: `<a href="${pageUrl}"><img src="${badgeUrl}" alt="MCPHub Trust Score" /></a>`,
    url: badgeUrl,
  };

  const snippet = snippets[format];

  return (
    <section className={cn('panel gradient-border rounded-2xl p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">For maintainers</p>
          <h2 className="mt-1.5 font-semibold tracking-tight">
            Scoring {trustTotal}/100? Show it off.
          </h2>
          <p className="text-text-muted mt-1.5 max-w-prose text-sm leading-relaxed">
            Add the badge to {name}&apos;s README. It updates automatically as the score changes.
          </p>
        </div>

        {/* The live endpoint, not a mock — what you see is what embeds. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={badgeUrl}
          alt={`MCPHub Trust Score badge for ${name}`}
          width={132}
          height={20}
          className="mt-1 shrink-0"
        />
      </div>

      <div className="mt-5 flex gap-1" role="tablist" aria-label="Badge snippet format">
        {FORMATS.map((option) => (
          <button
            key={option.id}
            role="tab"
            type="button"
            aria-selected={format === option.id}
            onClick={() => setFormat(option.id)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200',
              format === option.id
                ? 'bg-surface-hover text-foreground'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative mt-2">
        <pre className="bg-background overflow-x-auto rounded-xl border p-3 pr-12 font-mono text-xs leading-relaxed">
          <code>{snippet}</code>
        </pre>
        <div className="absolute right-2 top-2">
          <CopyButton value={snippet} label={`Copy badge ${format}`} />
        </div>
      </div>
    </section>
  );
}
