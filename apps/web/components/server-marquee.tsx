import Image from 'next/image';
import Link from 'next/link';

import { TrustPill } from '@/components/trust-pill';
import { cn } from '@/lib/utils';

/** The slice of a server the marquee shows. */
export interface MarqueeServer {
  slug: string;
  name: string;
  authorAvatar: string | null;
  trustTotal: number;
}

/** One scrolling row. The list is rendered twice so the loop is seamless. */
function Row({
  servers,
  reverse,
}: {
  servers: MarqueeServer[];
  reverse?: boolean;
}): React.JSX.Element {
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div
        className={cn(
          'animate-marquee flex w-max shrink-0 gap-3 pr-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none',
          reverse && '[animation-direction:reverse]',
        )}
        style={{ ['--marquee-duration' as string]: `${servers.length * 4}s` }}
      >
        {[...servers, ...servers].map((server, index) => (
          <Link
            key={`${server.slug}-${index}`}
            href={`/servers/${server.slug}`}
            // The second copy exists only for the visual loop.
            aria-hidden={index >= servers.length}
            tabIndex={index >= servers.length ? -1 : undefined}
            className="bg-surface hover:border-hover flex items-center gap-2.5 rounded-xl border py-2 pl-2 pr-2.5 shadow-sm transition-colors"
          >
            {server.authorAvatar ? (
              <Image
                src={server.authorAvatar}
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-lg border object-cover"
              />
            ) : (
              <span className="bg-surface-hover text-text-muted flex size-7 items-center justify-center rounded-lg border font-mono text-xs uppercase">
                {server.name.slice(0, 1)}
              </span>
            )}
            <span className="max-w-[10rem] truncate text-sm font-medium">{server.name}</span>
            <TrustPill score={server.trustTotal} className="h-6 px-2" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Two rows of real top servers gliding past in opposite directions.
 *
 * Live social proof in the space under the hero: every tile is a real,
 * scored server and a link. Pauses on hover, stops for reduced motion.
 */
export function ServerMarquee({
  servers,
  total,
}: {
  servers: MarqueeServer[];
  total: number;
}): React.JSX.Element | null {
  if (servers.length < 8) return null;
  const half = Math.ceil(servers.length / 2);

  return (
    <section aria-label="Popular MCP servers" className="py-6">
      <p className="text-text-muted mb-5 text-center text-sm">
        {total.toLocaleString()} servers indexed, from teams like these
      </p>
      <div className="space-y-3">
        <Row servers={servers.slice(0, half)} />
        <Row servers={servers.slice(half)} reverse />
      </div>
    </section>
  );
}
