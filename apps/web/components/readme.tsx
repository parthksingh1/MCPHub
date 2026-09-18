import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

/** Props for {@link Readme}. */
export interface ReadmeProps {
  markdown: string;
  /** `owner/repo`, used to resolve relative links and images. */
  repo: string | null;
  className?: string;
}

/**
 * Sanitisation schema.
 *
 * A README is untrusted input written by a third party, rendered on our
 * origin. The default GitHub-style schema already drops scripts, event
 * handlers, iframes and `javascript:` URLs; this only widens it enough for the
 * alignment attributes READMEs commonly use on centred logo blocks.
 */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), 'align', 'width', 'height'],
    p: [...(defaultSchema.attributes?.p ?? []), 'align'],
    div: [...(defaultSchema.attributes?.div ?? []), 'align'],
  },
};

/** True for URLs that are absolute or in-page anchors. */
function isAbsolute(url: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
}

/**
 * Resolves a README-relative path against the repository.
 *
 * `HEAD` rather than a branch name: it follows whatever the default branch is
 * without the crawler having to record it, and GitHub serves both raw files and
 * the blob view at that ref.
 */
function resolve(url: string, repo: string | null, kind: 'raw' | 'blob'): string {
  if (!repo || isAbsolute(url)) return url;

  const path = url.replace(/^\.?\//, '');
  return kind === 'raw'
    ? `https://raw.githubusercontent.com/${repo}/HEAD/${path}`
    : `https://github.com/${repo}/blob/HEAD/${path}`;
}

/** Renders a server's README as readable, safe HTML. */
export function Readme({ markdown, repo, className }: ReadmeProps): React.JSX.Element {
  return (
    <div className={cn('readme', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          a: ({ href, children, ...props }) => {
            const target = href ? resolve(href, repo, 'blob') : undefined;
            const external = target && !target.startsWith('#');
            return (
              <a
                {...props}
                href={target}
                {...(external ? { target: '_blank', rel: 'noreferrer noopener nofollow' } : {})}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt, ...props }) => (
            // Third-party README images cannot go through next/image: the host
            // list is unbounded, and proxying them would turn the deployment
            // into an open image proxy.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              src={typeof src === 'string' ? resolve(src, repo, 'raw') : undefined}
              alt={alt ?? ''}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
