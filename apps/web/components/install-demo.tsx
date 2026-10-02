'use client';

import { useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { cn } from '@/lib/utils';

/** One client's install snippet. */
interface ClientSnippet {
  id: string;
  label: string;
  /** Where the snippet goes, shown above the code. */
  where: string;
  code: string;
}

/**
 * Real install snippets for one real server (Microsoft's Playwright MCP), so
 * the demo shows exactly what a visitor would paste — not a mock.
 */
const CLIENTS: ClientSnippet[] = [
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    where: 'claude_desktop_config.json',
    code: `{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}`,
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    where: 'Terminal',
    code: 'claude mcp add playwright npx @playwright/mcp@latest',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    where: '.cursor/mcp.json',
    code: `{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}`,
  },
  {
    id: 'vscode',
    label: 'VS Code',
    where: 'Terminal',
    code: `code --add-mcp '{"name":"playwright","command":"npx","args":["@playwright/mcp@latest"]}'`,
  },
];

/**
 * "Install in seconds": the post-discovery step, shown working.
 *
 * Every server page has these snippets for its own package; this is the same
 * experience on the homepage, so visitors see the payoff before they search.
 */
export function InstallDemo(): React.JSX.Element {
  const [active, setActive] = useState(CLIENTS[0]?.id ?? '');
  const client = CLIENTS.find((item) => item.id === active) ?? CLIENTS[0];
  if (!client) return <></>;

  return (
    <section className="container py-16" aria-labelledby="install-heading">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow">Install in seconds</p>
          <h2 id="install-heading" className="text-section-title mt-2 font-semibold">
            Pick your client. Copy. Done.
          </h2>
          <p className="text-text-muted mt-3 max-w-md leading-relaxed">
            Every server page gives you the exact config for the AI client you use — no README
            digging, no guessing at JSON.
          </p>
          <ul className="text-text-secondary mt-6 space-y-2.5">
            {[
              'Ready-made for 6 AI clients',
              'Real package names from npm and PyPI',
              'Trust Score shown before you paste',
            ].map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span aria-hidden className="bg-accent size-1.5 rounded-full" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-[#0d0f13] text-slate-200 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.45)]">
          <div
            role="tablist"
            aria-label="AI client"
            className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 pt-3 [scrollbar-width:none]"
          >
            {CLIENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === client.id}
                onClick={() => setActive(item.id)}
                className={cn(
                  '-mb-px shrink-0 cursor-pointer rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                  item.id === client.id
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="relative p-5">
            <p className="font-mono text-xs text-slate-500">{client.where}</p>
            <pre
              key={client.id}
              className="animate-fade-up mt-3 overflow-x-auto pr-12 font-mono text-[13px] leading-relaxed"
            >
              <code>{client.code}</code>
            </pre>
            <div className="absolute right-4 top-4">
              <CopyButton value={client.code} label={`Copy ${client.label} config`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
