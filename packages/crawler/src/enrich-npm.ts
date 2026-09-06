import { MCP_CLIENTS, type CompatibleClients, type InstallCommands } from '@mcphub/shared';

import {
  buildSlug,
  canonicalizeRepoUrl,
  ensureUniqueSlug,
  parseGitHubUrl,
  slugify,
} from './canonicalize';
import { buildTags, inferCategories, inferLanguage, isOfficialOwner } from './classify';
import { parseReadme } from './parse-readme';
import { getNpmPackage, getNpmWeeklyDownloads } from './registries';
import type { DiscoveredServer } from './types';

/** Fields of an npm packument this module reads. */
interface Packument {
  name: string;
  description?: string;
  readme?: string;
  keywords?: string[];
  license?: string | { type?: string };
  homepage?: string;
  repository?: string | { url?: string };
  author?: string | { name?: string };
  time?: Record<string, string>;
  'dist-tags'?: Record<string, string>;
  versions?: Record<string, { types?: string; typings?: string; devDependencies?: object }>;
}

/** Normalises npm's several `license` spellings to an SPDX-ish string. */
function readLicense(packument: Packument): string | null {
  const license = packument.license;
  if (!license) return null;

  return typeof license === 'string' ? license : (license.type ?? null);
}

/** Normalises npm's several `repository` spellings to a canonical URL. */
function readRepoUrl(packument: Packument): string | null {
  const repository = packument.repository;
  if (!repository) return null;

  const raw = typeof repository === 'string' ? repository : repository.url;
  return raw ? canonicalizeRepoUrl(raw) : null;
}

/** Normalises npm's `author` field to a display name. */
function readAuthor(packument: Packument): string | null {
  const author = packument.author;
  if (!author) return null;

  return typeof author === 'string' ? author.replace(/\s*<.*$/, '').trim() : (author.name ?? null);
}

/**
 * Builds a server record from an npm package alone.
 *
 * The GitHub path produces a richer record — stars, commit recency, the file
 * tree behind the quality signals — and is preferred whenever the API budget
 * allows. This path exists for the cases it cannot cover: a package whose
 * repository is not on GitHub, and the very real situation of the rate limit
 * being exhausted mid-run. A server indexed with a modest Trust Score is far
 * more useful than one missing from the directory entirely.
 *
 * Trust Score consequences are honest rather than flattering: with no commit
 * data the maintenance component reflects the last publish date, and the
 * quality component only credits what the registry actually proves.
 */
export async function enrichFromNpm(
  packageName: string,
  takenSlugs: Set<string>,
): Promise<DiscoveredServer | null> {
  const packument = (await getNpmPackage(packageName)) as Packument | null;
  if (!packument) return null;

  const repoUrl = readRepoUrl(packument);
  const identity = repoUrl ? parseGitHubUrl(repoUrl) : null;

  const readme = packument.readme ?? '';
  const facts = parseReadme(readme);

  const keywords = packument.keywords ?? [];
  const description =
    packument.description?.trim() || facts.description || `The ${packageName} MCP server.`;

  // `time` maps every version to its publish date; `modified` is the most
  // recent write of any kind, which is the closest thing npm offers to a
  // "still maintained" signal.
  const lastPublishAt = packument.time?.modified ?? packument.time?.created ?? null;
  const firstPublishAt = packument.time?.created ?? null;

  const latestVersion = packument['dist-tags']?.latest;
  const latest = latestVersion ? packument.versions?.[latestVersion] : undefined;

  const slugBase = identity ? buildSlug(identity) : slugify(packageName.replace(/^@[^/]+\//, ''));
  const slug = ensureUniqueSlug(slugBase, takenSlugs);

  const owner = identity?.owner ?? readAuthor(packument);
  const language = inferLanguage(latest?.types || latest?.typings ? 'TypeScript' : null);

  const compatibleClients = Object.fromEntries(
    MCP_CLIENTS.map((client) => [client, facts.transport.includes('stdio')]),
  ) as CompatibleClients;

  const argsJson = `"-y", "${packageName}"`;
  const configJson = [
    '{',
    '  "mcpServers": {',
    `    "${slug}": {`,
    '      "command": "npx",',
    `      "args": [${argsJson}]`,
    '    }',
    '  }',
    '}',
  ].join('\n');

  const installCommands: InstallCommands = {
    claudeCode: `claude mcp add ${slug} -- npx -y ${packageName}`,
    claudeDesktop: configJson,
    cursor: configJson,
    cline: configJson,
    windsurf: configJson,
    vscode: configJson,
    ...facts.installCommands,
  };

  return {
    slug,
    name: packageName.replace(/^@[^/]+\//, ''),
    description: description.slice(0, 300),
    longDescription: readme || null,

    authorName: owner,
    authorGithub: identity?.owner ?? null,
    authorAvatar: identity ? `https://github.com/${identity.owner}.png` : null,
    isOfficial: owner ? isOfficialOwner(owner) : false,

    sourceType: 'npm',
    // npm packages without a repository still need a stable unique key, and
    // `repo_url` is the upsert target. The registry URL is the canonical
    // location of such a package, so it serves that role honestly.
    repoUrl: repoUrl ?? `https://www.npmjs.com/package/${packageName}`,
    packageName,
    homepageUrl: packument.homepage?.trim() || null,

    categories: inferCategories(packageName, description, keywords, readme),
    tags: buildTags(keywords, language),
    language,
    license: readLicense(packument),

    compatibleClients,
    transport: facts.transport,
    installCommands,
    capabilities: {
      tools: facts.toolNames.map((name) => ({ name })),
      resources: facts.hasResources,
      prompts: facts.hasPrompts,
    },

    githubStars: 0,
    githubForks: 0,
    githubIssues: 0,
    // A publish is a weaker maintenance signal than a commit, but it is a real
    // one, and it is the only one available here.
    lastCommitAt: lastPublishAt,
    firstReleaseAt: firstPublishAt,
    lastReleaseAt: lastPublishAt,
    npmWeeklyDownloads: await getNpmWeeklyDownloads(packageName),
    pypiMonthlyDownloads: null,

    quality: {
      readmeLength: readme.length,
      hasLicense: readLicense(packument) !== null,
      // The registry proves types are shipped; it cannot see tests or CI, so
      // those stay false rather than being guessed at.
      hasTypes: Boolean(latest?.types || latest?.typings),
      hasTests: false,
      hasCi: false,
    },
  };
}
