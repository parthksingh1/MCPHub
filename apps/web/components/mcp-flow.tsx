import { Bot, Code2, MousePointer2, ShieldCheck, Sparkles, Terminal, Wind } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { TrustPill } from '@/components/trust-pill';

/** A server shown on the right-hand side of the diagram. */
export interface FlowServer {
  slug: string;
  name: string;
  authorAvatar: string | null;
  trustTotal: number;
}

/** The AI clients on the left: the places people actually use MCP. */
const CLIENTS = [
  { label: 'Claude Desktop', icon: Sparkles },
  { label: 'Claude Code', icon: Terminal },
  { label: 'Cursor', icon: MousePointer2 },
  { label: 'VS Code', icon: Code2 },
  { label: 'Windsurf', icon: Wind },
] as const;

/** Row centres, in the 1000×440 diagram coordinate space. */
const ROWS = [60, 140, 220, 300, 380] as const;
const CENTER = { x: 500, y: 220 };

/**
 * "How MCPHub works", as an animated beam diagram.
 *
 * Pulses of light travel from each AI client into MCPHub, and from MCPHub out
 * to real, scored servers — the product's whole job in one picture. The nodes
 * are HTML positioned in percentages of the same 1000×440 space the SVG paths
 * are drawn in, so they line up at every width. Pure CSS animation; it stops
 * for people who prefer reduced motion.
 */
export function McpFlow({ servers }: { servers: FlowServer[] }): React.JSX.Element | null {
  const right = servers.slice(0, ROWS.length);
  if (right.length < ROWS.length) return null;

  const leftPath = (y: number): string => `M245 ${y} C 360 ${y}, 380 ${CENTER.y}, 452 ${CENTER.y}`;
  const rightPath = (y: number): string => `M548 ${CENTER.y} C 610 ${CENTER.y}, 630 ${y}, 722 ${y}`;

  return (
    <div className="relative mx-auto hidden aspect-[1000/440] w-full max-w-5xl md:block">
      <svg viewBox="0 0 1000 440" className="absolute inset-0 size-full" fill="none" aria-hidden>
        <defs>
          <linearGradient
            id="flow-beam"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="1000"
            y2="0"
          >
            <stop offset="0" stopColor="hsl(var(--accent))" />
            <stop offset="0.5" stopColor="hsl(var(--accent-to))" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {ROWS.map((y, index) => (
          <g key={y}>
            <path d={leftPath(y)} stroke="var(--border-hover)" strokeWidth="1.5" />
            <path d={rightPath(y)} stroke="var(--border-hover)" strokeWidth="1.5" />
            <path
              d={leftPath(y)}
              stroke="url(#flow-beam)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="70 350"
              className="animate-beam motion-reduce:hidden"
              style={{ animationDelay: `${index * 0.45}s` }}
            />
            <path
              d={rightPath(y)}
              stroke="url(#flow-beam)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="70 350"
              className="animate-beam motion-reduce:hidden"
              style={{ animationDelay: `${1.6 + index * 0.45}s` }}
            />
          </g>
        ))}
      </svg>

      {/* Left: AI clients. */}
      {CLIENTS.map((client, index) => (
        <div
          key={client.label}
          className="bg-surface absolute flex w-[18%] -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-xl border px-3 py-2 shadow-sm"
          style={{ left: '15%', top: `${((ROWS[index] ?? CENTER.y) / 440) * 100}%` }}
        >
          <span className="bg-surface-hover flex size-7 shrink-0 items-center justify-center rounded-lg border">
            <client.icon className="size-4" aria-hidden />
          </span>
          <span className="truncate text-sm font-medium">{client.label}</span>
        </div>
      ))}

      {/* Centre: MCPHub, checking everything that passes through. */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: '50%', top: '50%' }}
      >
        <div className="relative flex flex-col items-center">
          <span
            aria-hidden
            className="absolute top-0 size-24 animate-ping rounded-3xl opacity-20 motion-reduce:hidden"
            style={{ background: 'hsl(var(--accent) / 0.35)', animationDuration: '3s' }}
          />
          <div className="bg-surface halo relative flex size-24 items-center justify-center rounded-3xl border">
            <Image src="/brand/mark.png" alt="MCPHub" width={64} height={64} className="size-16" />
          </div>
          <span className="bg-surface mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
            <ShieldCheck className="text-accent size-3.5" aria-hidden />
            Scored &amp; scanned
          </span>
        </div>
      </div>

      {/* Right: real, scored servers. */}
      {right.map((server, index) => (
        <Link
          key={server.slug}
          href={`/servers/${server.slug}`}
          className="bg-surface hover:border-hover absolute flex w-[23%] -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-xl border px-2.5 py-2 shadow-sm transition-colors"
          style={{ left: '84%', top: `${((ROWS[index] ?? CENTER.y) / 440) * 100}%` }}
        >
          {server.authorAvatar ? (
            <Image
              src={server.authorAvatar}
              alt=""
              width={28}
              height={28}
              className="size-7 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <span className="bg-surface-hover flex size-7 shrink-0 items-center justify-center rounded-lg border">
              <Bot className="size-4" aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{server.name}</span>
          <TrustPill score={server.trustTotal} className="h-6 px-2" />
        </Link>
      ))}
    </div>
  );
}
