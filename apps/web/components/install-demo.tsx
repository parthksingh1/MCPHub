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
 * A tabbed terminal with the exact install config for each AI client.
 *
 * Every server page has these snippets for its own package; this is the same
 * experience on the homepage, so visitors see the payoff before they search.
 */
export function InstallTerminal({ className }: { className?: string }): React.JSX.Element {
  const [active, setActive] = useState(CLIENTS[0]?.id ?? '');
  const client = CLIENTS.find((item) => item.id === active) ?? CLIENTS[0];
  if (!client) return <></>;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-white/10 bg-[#0d0f13] text-slate-200',
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="AI client"
        className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 pt-2 [scrollbar-width:none]"
      >
        {CLIENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === client.id}
            onClick={() => setActive(item.id)}
            className={cn(
              '-mb-px shrink-0 cursor-pointer border-b-2 px-3 py-2 text-[13px] font-medium transition-colors',
              item.id === client.id
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="relative p-4">
        <p className="font-mono text-[11px] text-slate-500">{client.where}</p>
        <pre
          key={client.id}
          className="animate-fade-up mt-2.5 min-h-[9.5rem] overflow-x-auto pr-12 font-mono text-[12.5px] leading-relaxed"
        >
          <code>{client.code}</code>
        </pre>
        <div className="absolute right-3 top-3">
          <CopyButton value={client.code} label={`Copy ${client.label} config`} />
        </div>
      </div>
    </div>
  );
}
