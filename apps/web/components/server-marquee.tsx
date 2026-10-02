import Image from 'next/image';
import Link from 'next/link';

/** The slice of a server the marquee shows. */
export interface MarqueeServer {
  slug: string;
  name: string;
  authorAvatar: string | null;
  trustTotal: number;
}

/**
 * A single, quiet row of real servers gliding past: the "trusted by" strip.
 *
 * Deliberately monochrome — avatars are desaturated until hovered and there
 * are no score pills — so it reads as a calm logo wall under the hero rather
 * than a second, competing list. Pauses on hover, stops for reduced motion.
 */
export function ServerMarquee({
  servers,
  total,
}: {
  servers: MarqueeServer[];
  total: number;
}): React.JSX.Element | null {
  if (servers.length < 8) return null;
  const row = servers.slice(0, 20);

  return (
    <section aria-label="Popular MCP servers" className="py-10">
      <p className="text-text-muted text-center text-sm">
        Scoring {total.toLocaleString()} servers, from teams like these
      </p>
      <div className="group mt-7 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]">
        <div
          className="animate-marquee flex w-max shrink-0 items-center gap-12 pr-12 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ ['--marquee-duration' as string]: `${row.length * 3.5}s` }}
        >
          {[...row, ...row].map((server, index) => (
            <Link
              key={`${server.slug}-${index}`}
              href={`/servers/${server.slug}`}
              // The second copy exists only for the visual loop.
              aria-hidden={index >= row.length}
              tabIndex={index >= row.length ? -1 : undefined}
              className="text-text-muted hover:text-foreground flex items-center gap-2.5 opacity-80 grayscale transition-[filter,opacity,color] duration-300 hover:opacity-100 hover:grayscale-0"
            >
              {server.authorAvatar ? (
                <Image
                  src={server.authorAvatar}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 rounded-md object-cover"
                />
              ) : (
                <span className="bg-surface-hover flex size-6 items-center justify-center rounded-md font-mono text-[11px] uppercase">
                  {server.name.slice(0, 1)}
                </span>
              )}
              <span className="max-w-[11rem] truncate text-[15px] font-semibold tracking-tight">
                {server.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
