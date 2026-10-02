'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Check, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { TrustPill } from '@/components/trust-pill';
import { cn } from '@/lib/utils';

/** A server shown in the panel's leaderboard. */
export interface HeroPanelServer {
  slug: string;
  name: string;
  authorName: string | null;
  trustTotal: number;
}

/** Props for {@link HeroPanel}. */
export interface HeroPanelProps {
  servers: HeroPanelServer[];
  className?: string;
}

/** The install command typed out in the panel's terminal strip. */
const DEMO_COMMAND = 'npx -y @modelcontextprotocol/server-github';

/**
 * The hero's right-hand panel.
 *
 * A hero with a headline on the left and nothing on the right reads as
 * unfinished, and a stock illustration reads as a template. This fills the
 * space with the product itself: a live leaderboard of the highest-scoring
 * indexed servers, above a terminal strip that types out a real install
 * command. Both are things MCPHub actually does, so the hero doubles as a
 * demo — and every number in it comes from the database.
 */
export function HeroPanel({ servers, className }: HeroPanelProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState(reduceMotion ? DEMO_COMMAND : '');
  const [copied, setCopied] = useState(false);

  // A one-shot typing effect. Deliberately not looped: a command that retypes
  // itself forever is a distraction on every subsequent scroll past the hero.
  useEffect(() => {
    if (reduceMotion) return;

    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTyped(DEMO_COMMAND.slice(0, index));

      if (index >= DEMO_COMMAND.length) {
        clearInterval(timer);
        setTimeout(() => setCopied(true), 400);
      }
    }, 34);

    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative', className)}
    >
      <div className="panel shadow-card relative overflow-hidden rounded-2xl">
        {/* Window chrome — grounds the panel as a real interface. */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="bg-danger/60 size-2.5 rounded-full" />
            <span className="bg-warn/60 size-2.5 rounded-full" />
            <span className="bg-success/60 size-2.5 rounded-full" />
          </span>
          <span className="text-text-muted ml-2 font-mono text-[11px]">top rated — live</span>
        </div>

        <ul className="divide-border divide-y">
          {servers.slice(0, 4).map((server, index) => (
            <motion.li
              key={server.slug}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/servers/${server.slug}`}
                className="hover:bg-surface-hover group flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <span className="text-text-muted w-4 shrink-0 font-mono text-[11px] tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium tracking-tight">
                    {server.name}
                  </span>
                  {server.authorName && (
                    <span className="text-text-muted block truncate font-mono text-[11px]">
                      {server.authorName}
                    </span>
                  )}
                </span>

                <TrustPill score={server.trustTotal} />

                <ArrowUpRight
                  className="text-text-muted size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            </motion.li>
          ))}
        </ul>

        {/* Terminal strip */}
        <div className="bg-background/60 border-t px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Terminal className="text-text-muted size-3.5 shrink-0" aria-hidden />
            <code className="text-text-secondary min-w-0 flex-1 truncate">
              {typed}
              {!reduceMotion && typed.length < DEMO_COMMAND.length && (
                <span className="bg-accent ml-0.5 inline-block h-3 w-1.5 animate-pulse align-middle" />
              )}
            </code>
            {copied && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-success inline-flex shrink-0 items-center gap-1"
              >
                <Check className="size-3" aria-hidden />
                copied
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
