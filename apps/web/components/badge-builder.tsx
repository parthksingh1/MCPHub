'use client';

import { useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { BADGE_STYLES, type BadgeStyle } from '@/lib/badge';
import { cn } from '@/lib/utils';

/** Props for {@link BadgeBuilder}. */
export interface BadgeBuilderProps {
  /** Canonical origin, passed from the server so it is correct in every env. */
  siteUrl: string;
  /** Fixed server slug. When omitted, the builder shows a slug input. */
  slug?: string;
  /** Display name used in alt text. */
  name?: string;
  className?: string;
}

/** The snippet formats a maintainer might want. */
const FORMATS = [
  { id: 'markdown', label: 'Markdown' },
  { id: 'html', label: 'HTML' },
  { id: 'rst', label: 'reST' },
  { id: 'url', label: 'URL' },
] as const;

type FormatId = (typeof FORMATS)[number]['id'];

/** Small segmented control used for both style and format. */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}): React.JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-surface inline-flex rounded-lg border p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150',
            value === option.id
              ? 'bg-foreground text-background'
              : 'text-text-muted hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Badge snippet builder: pick a style and a format, see the live badge, copy.
 *
 * The preview is the real endpoint, not a mock — what you see is exactly what
 * embeds.
 */
export function BadgeBuilder({
  siteUrl,
  slug: fixedSlug,
  name,
  className,
}: BadgeBuilderProps): React.JSX.Element {
  const [input, setInput] = useState('');
  const [kind, setKind] = useState<'score' | 'trusted'>('trusted');
  const [style, setStyle] = useState<BadgeStyle>('flat');
  const [format, setFormat] = useState<FormatId>('markdown');

  // Slugs are lowercase kebab-case; normalising here means a pasted URL tail
  // or stray capital still produces a working badge.
  const slug =
    fixedSlug ??
    (input
      .trim()
      .toLowerCase()
      .replace(/^.*\/servers\//, '')
      .replace(/[^a-z0-9-]/g, '') ||
      'your-server');

  const queryParams = new URLSearchParams();
  if (kind === 'trusted') queryParams.set('type', 'trusted');
  if (style !== 'flat') queryParams.set('style', style);
  const query = queryParams.size > 0 ? `?${queryParams}` : '';
  const badgeUrl = `${siteUrl}/api/badge/${slug}${query}`;
  // The preview loads from whatever host is serving this page, so it works on
  // preview deployments and locally; the snippet keeps the canonical URL.
  const previewUrl = `/api/badge/${slug}${query}`;
  const pageUrl = `${siteUrl}/servers/${slug}`;
  const alt = kind === 'trusted' ? 'MCPHub Trusted' : 'MCPHub Trust Score';

  const snippets: Record<FormatId, string> = {
    markdown: `[![${alt}](${badgeUrl})](${pageUrl})`,
    html: `<a href="${pageUrl}"><img src="${badgeUrl}" alt="${alt}" /></a>`,
    rst: `.. image:: ${badgeUrl}\n   :target: ${pageUrl}\n   :alt: ${alt}`,
    url: badgeUrl,
  };
  const snippet = snippets[format];

  return (
    <div className={cn('space-y-4', className)}>
      {!fixedSlug && (
        <div>
          <label htmlFor="badge-slug" className="text-sm font-medium">
            Server slug or MCPHub URL
          </label>
          <input
            id="badge-slug"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g. github-mcp-server"
            autoComplete="off"
            spellCheck={false}
            className="bg-background mt-1.5 h-10 w-full rounded-lg border px-3 font-mono text-sm outline-none focus-visible:ring-2"
          />
          <p className="text-text-muted mt-1.5 text-xs">
            The last part of the server&apos;s page address: {siteUrl.replace(/^https?:\/\//, '')}
            /servers/
            <span className="text-foreground font-mono">{slug}</span>
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Badge type"
          options={[
            { id: 'trusted', label: 'MCPHub Trusted' },
            { id: 'score', label: 'Trust Score' },
          ]}
          value={kind}
          onChange={setKind}
        />
        <Segmented
          label="Badge style"
          options={BADGE_STYLES.map((id) => ({ id, label: id }))}
          value={style}
          onChange={setStyle}
        />
        <Segmented label="Snippet format" options={FORMATS} value={format} onChange={setFormat} />
      </div>

      <div className="bg-background flex min-h-16 items-center justify-center rounded-xl border border-dashed p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={previewUrl} src={previewUrl} alt={`${alt} badge${name ? ` for ${name}` : ''}`} />
      </div>

      <div className="relative">
        <pre className="bg-background overflow-x-auto rounded-xl border p-3 pr-12 font-mono text-xs leading-relaxed">
          <code>{snippet}</code>
        </pre>
        <div className="absolute right-2 top-2">
          <CopyButton value={snippet} label={`Copy badge ${format}`} />
        </div>
      </div>
    </div>
  );
}
