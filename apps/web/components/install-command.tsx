'use client';

import { MCP_CLIENTS, MCP_CLIENT_LABELS, type McpClient } from '@mcphub/shared';
import { Download, Terminal } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { cn } from '@/lib/utils';

/** Props for {@link InstallCommand}. */
export interface InstallCommandProps {
  /** Install commands keyed by client, as stored on the server row. */
  commands: Partial<Record<McpClient, string>>;
  /** Slug, used to name the downloaded config file. */
  slug: string;
  className?: string;
}

/** Where each client keeps its MCP configuration, shown as a hint. */
const CONFIG_LOCATIONS: Partial<Record<McpClient, string>> = {
  claudeDesktop: '~/Library/Application Support/Claude/claude_desktop_config.json',
  cursor: '~/.cursor/mcp.json',
  cline: 'VS Code → Cline → MCP Servers',
  windsurf: '~/.codeium/windsurf/mcp_config.json',
  vscode: '.vscode/mcp.json',
};

/**
 * Per-client install instructions with a copy button.
 *
 * This is the component the whole site exists to deliver. Only clients that
 * actually have a command are shown as tabs — an empty tab labelled "Cursor"
 * is worse than no tab, because it implies the server does not work there when
 * really we just have no instructions.
 */
export function InstallCommand({
  commands,
  slug,
  className,
}: InstallCommandProps): React.JSX.Element | null {
  const available = useMemo(
    () => MCP_CLIENTS.filter((client) => Boolean(commands[client]?.trim())),
    [commands],
  );

  const [active, setActive] = useState<McpClient | undefined>(available[0]);

  if (available.length === 0) {
    return (
      <div className={cn('bg-surface text-text-muted rounded-lg border p-5 text-sm', className)}>
        <Terminal className="mb-2 size-4" aria-hidden />
        No install command has been published for this server yet. Check the repository README for
        setup instructions.
      </div>
    );
  }

  const current = active && available.includes(active) ? active : available[0];
  if (!current) return null;

  const command = commands[current]?.trim() ?? '';
  const location = CONFIG_LOCATIONS[current];
  const isJson = command.startsWith('{');

  /**
   * Offers the JSON config as a file download.
   *
   * Hand-editing `claude_desktop_config.json` is where most people give up on
   * MCP, so handing them the exact file is worth the few lines it costs.
   */
  const download = (): void => {
    const blob = new Blob([command], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug}.mcp.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('bg-surface rounded-lg border', className)}>
      <div
        role="tablist"
        aria-label="Install instructions by client"
        className="flex gap-1 overflow-x-auto border-b p-1.5"
      >
        {available.map((client) => (
          <button
            key={client}
            role="tab"
            type="button"
            aria-selected={client === current}
            onClick={() => setActive(client)}
            className={cn(
              'whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium transition-colors duration-200',
              client === current
                ? 'bg-surface-hover text-foreground'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {MCP_CLIENT_LABELS[client]}
          </button>
        ))}
      </div>

      <div className="p-4">
        {location && (
          <p className="text-text-muted mb-2 flex items-center gap-1.5 text-xs">
            <Terminal className="size-3" aria-hidden />
            <code className="truncate font-mono">{location}</code>
          </p>
        )}

        <div className="relative">
          <pre className="bg-background max-h-72 overflow-auto rounded-md border p-3 pr-12 font-mono text-xs leading-relaxed">
            <code>{command}</code>
          </pre>

          <div className="absolute right-2 top-2 flex gap-1">
            {isJson && (
              <button
                type="button"
                onClick={download}
                aria-label="Download configuration file"
                className="text-text-muted hover:border-hover hover:bg-surface-hover hover:text-foreground inline-flex size-8 items-center justify-center rounded-md border transition-all duration-200"
              >
                <Download className="size-4" />
              </button>
            )}
            <CopyButton
              value={command}
              label={`Copy ${MCP_CLIENT_LABELS[current]} install command`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
