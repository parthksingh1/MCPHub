import { MCP_CLIENTS, type CompatibleClients, type InstallCommands } from '@mcphub/shared';

import { buildSlug, ensureUniqueSlug, parseGitHubUrl } from './canonicalize';
import {
  buildTags,
  deriveQualitySignals,
  inferCategories,
  inferLanguage,
  isOfficialOwner,
  looksLikeMcpServer,
} from './classify';
import type { GitHubClient } from './github';
import { parseReadme } from './parse-readme';
import { getNpmWeeklyDownloads } from './registries';
import type { DiscoveredServer, RepoCandidate } from './types';

/** Every client set to false, the starting point before evidence is applied. */
function emptyClients(): CompatibleClients {
  return Object.fromEntries(MCP_CLIENTS.map((client) => [client, false])) as CompatibleClients;
}

/**
 * Builds the install command set for a server.
 *
 * README-derived commands always win. Where none exists, a command is
 * synthesised from the package name — every MCP client accepts the same
 * `npx`/`uvx` invocation, so a synthesised command is genuinely correct rather
 * than a guess, and it is what makes one-click install work for the long tail.
 */
function buildInstallCommands(
  fromReadme: Partial<Record<keyof InstallCommands, string>>,
  npmPackage: string | null,
  pypiPackage: string | null,
  serverKey: string,
): InstallCommands {
  const commands = { ...fromReadme } as InstallCommands;

  const runner = npmPackage
    ? { cmd: 'npx', args: ['-y', npmPackage] }
    : pypiPackage
      ? { cmd: 'uvx', args: [pypiPackage] }
      : null;

  if (!runner) return commands;

  const argsJson = runner.args.map((arg) => `"${arg}"`).join(', ');

  // Claude Code installs from the CLI.
  commands.claudeCode ??= `claude mcp add ${serverKey} -- ${runner.cmd} ${runner.args.join(' ')}`;

  // Every other client reads the same JSON config shape.
  const configJson = [
    '{',
    '  "mcpServers": {',
    `    "${serverKey}": {`,
    `      "command": "${runner.cmd}",`,
    `      "args": [${argsJson}]`,
    '    }',
    '  }',
    '}',
  ].join('\n');

  commands.claudeDesktop ??= configJson;
  commands.cursor ??= configJson;
  commands.cline ??= configJson;
  commands.windsurf ??= configJson;
  commands.vscode ??= configJson;

  return commands;
}

/**
 * Infers client compatibility.
 *
 * A stdio server works in every MCP client by definition — the protocol is the
 * point — so compatibility is assumed unless the README says otherwise, and
 * explicit documentation only ever adds confidence.
 */
function inferCompatibleClients(
  transport: string[],
  documented: Partial<Record<keyof CompatibleClients, string>>,
): CompatibleClients {
  const clients = emptyClients();
  const supportsStdio = transport.includes('stdio');

  for (const client of MCP_CLIENTS) {
    clients[client] = supportsStdio || Boolean(documented[client]);
  }

  return clients;
}

/**
 * Turns a discovered repository into a complete, scoreable server record.
 *
 * Returns null when the repository has vanished or is unreadable — a 404 on a
 * link harvested from a two-year-old awesome-list is routine, not an error.
 */
export async function enrichCandidate(
  github: GitHubClient,
  candidate: RepoCandidate,
  takenSlugs: Set<string>,
): Promise<DiscoveredServer | null> {
  const identity = parseGitHubUrl(candidate.repoUrl);
  if (!identity) return null;

  const repoResult = await github.getRepo(identity.owner, identity.repo);
  if (repoResult.status !== 'ok') return null;

  const repo = repoResult.data;
  if (repo.archived) return null;

  // Re-apply the server test with the repository's real metadata.
  //
  // Discovery filters GitHub search results using only what the search index
  // returns, and applies no filter at all to registry hits. This is the first
  // point where the authoritative topics and description are available, so it
  // is the right place to reject a platform that merely integrates with MCP.
  //
  // Human-curated sources are exempt: an entry in an awesome-list or a
  // deliberate user submission has already had a person vouch for it, and
  // second-guessing that would reject legitimate servers whose READMEs simply
  // do not use the phrasing this heuristic looks for.
  const isCurated =
    candidate.discoveredVia.startsWith('awesome:') || candidate.discoveredVia === 'submission';

  if (!isCurated && !looksLikeMcpServer(repo.name, repo.description, repo.topics ?? [])) {
    return null;
  }

  const readme = (await github.getReadme(identity.owner, identity.repo)) ?? '';
  const facts = parseReadme(readme);

  const [releases, tree] = await Promise.all([
    github.getReleases(identity.owner, identity.repo),
    github.getTree(identity.owner, identity.repo, repo.default_branch),
  ]);

  const language = inferLanguage(repo.language);
  const topics = repo.topics ?? [];

  const npmPackage =
    candidate.registry === 'npm' ? (candidate.packageName ?? null) : facts.npmPackage;
  const pypiPackage =
    candidate.registry === 'pypi' ? (candidate.packageName ?? null) : facts.pypiPackage;

  const npmWeeklyDownloads = npmPackage ? await getNpmWeeklyDownloads(npmPackage) : null;

  // Releases come back newest-first; the oldest of the page is the closest
  // available approximation of a first release without paging the whole history.
  const publishedReleases = releases.filter((release) => release.published_at !== null);
  const lastReleaseAt = publishedReleases[0]?.published_at ?? null;
  const firstReleaseAt = publishedReleases.at(-1)?.published_at ?? null;

  // `takenSlugs` is seeded by the caller with every slug already in the
  // database, so this resolves collisions against persisted rows too — not
  // just against others discovered in the same run.
  const slug = ensureUniqueSlug(buildSlug(identity), takenSlugs);

  const description =
    repo.description?.trim() || facts.description || `An MCP server by ${repo.owner.login}.`;

  return {
    slug,
    name: repo.name,
    description: description.slice(0, 300),
    longDescription: readme || null,

    authorName: repo.owner.login,
    authorGithub: repo.owner.login,
    authorAvatar: repo.owner.avatar_url,
    isOfficial: isOfficialOwner(repo.owner.login),

    sourceType:
      candidate.registry === 'pypi' ? 'pypi' : candidate.registry === 'npm' ? 'npm' : 'github',
    repoUrl: repo.html_url,
    packageName: npmPackage ?? pypiPackage,
    homepageUrl: repo.homepage?.trim() || null,

    categories: inferCategories(repo.name, repo.description ?? '', topics, readme),
    tags: buildTags(topics, language),
    language,
    license: repo.license?.spdx_id ?? null,

    compatibleClients: inferCompatibleClients(facts.transport, facts.installCommands),
    transport: facts.transport,
    installCommands: buildInstallCommands(facts.installCommands, npmPackage, pypiPackage, slug),
    capabilities: {
      tools: facts.toolNames.map((name) => ({ name })),
      resources: facts.hasResources,
      prompts: facts.hasPrompts,
    },

    githubStars: repo.stargazers_count,
    githubForks: repo.forks_count,
    githubIssues: repo.open_issues_count,
    lastCommitAt: repo.pushed_at,
    firstReleaseAt,
    lastReleaseAt,
    npmWeeklyDownloads,
    pypiMonthlyDownloads: null,

    quality: deriveQualitySignals(tree, readme.length, language),
  };
}
