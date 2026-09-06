import type { QualitySignals } from '@mcphub/scoring';
import type { Category, Language } from '@mcphub/shared';

import type { GitHubTreeEntry } from './types';

/**
 * Keyword signals per category, matched against name, description, and topics.
 *
 * Ordered by specificity: `database` before `data`, so "postgres" does not get
 * swallowed by the broader bucket.
 */
const CATEGORY_KEYWORDS: [Category, RegExp][] = [
  [
    'database',
    /\b(postgres|postgresql|mysql|sqlite|mongodb|redis|supabase|neo4j|clickhouse|duckdb|database|sql\b|prisma|planetscale|cassandra|dynamodb)\b/i,
  ],
  [
    'browser',
    /\b(browser|playwright|puppeteer|selenium|chrome|firefox|webdriver|scrape|scraping|crawl)\b/i,
  ],
  [
    'communication',
    /\b(slack|discord|telegram|email|gmail|smtp|twilio|sms|whatsapp|teams|matrix|mastodon|chat)\b/i,
  ],
  [
    'devops',
    /\b(kubernetes|k8s|docker|terraform|ansible|jenkins|ci\/cd|deploy|helm|nomad|pulumi)\b/i,
  ],
  [
    'cloud',
    /\b(aws|azure|gcp|google cloud|cloudflare|vercel|netlify|s3\b|lambda|digitalocean|heroku)\b/i,
  ],
  [
    'devtools',
    /\b(github|gitlab|bitbucket|git\b|jira|linear|sentry|debugger|lsp|compiler|package manager|npm\b)\b/i,
  ],
  ['ai', /\b(openai|anthropic|llm|embedding|vector|rag\b|huggingface|ollama|langchain|prompt)\b/i],
  [
    'productivity',
    /\b(notion|obsidian|todoist|calendar|asana|trello|clickup|airtable|note-taking|todo)\b/i,
  ],
  ['files', /\b(filesystem|file system|dropbox|google drive|onedrive|ftp|sftp|storage|pdf)\b/i],
  ['search', /\b(search|brave search|elasticsearch|algolia|meilisearch|typesense|serp)\b/i],
  ['finance', /\b(stripe|payment|invoice|accounting|quickbooks|stock|crypto|trading|bank)\b/i],
  ['security', /\b(security|vulnerability|scanner|pentest|secrets|vault|auth0|okta|owasp)\b/i],
  ['monitoring', /\b(monitoring|observability|grafana|prometheus|datadog|logging|metrics|apm)\b/i],
  ['design', /\b(figma|sketch|canva|design|image generation|screenshot|svg)\b/i],
  ['data', /\b(analytics|dataset|pandas|jupyter|bigquery|snowflake|etl|dashboard|csv)\b/i],
];

/** GitHub language names mapped onto our normalised set. */
const LANGUAGE_MAP: Record<string, Language> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  java: 'java',
  'c#': 'csharp',
  csharp: 'csharp',
  ruby: 'ruby',
};

/**
 * Infers categories from a repository's text.
 *
 * Returns at most three, and never an empty array — an unclassifiable server
 * lands in `other` rather than disappearing from every category page.
 */
export function inferCategories(
  name: string,
  description: string,
  topics: string[],
  readme = '',
): Category[] {
  // README text is weighted last and truncated: past the first few thousand
  // characters it is mostly changelogs and unrelated links.
  const haystack = [name, description, topics.join(' '), readme.slice(0, 4000)].join(' ');

  const matched: Category[] = [];
  for (const [category, pattern] of CATEGORY_KEYWORDS) {
    if (pattern.test(haystack)) matched.push(category);
    if (matched.length === 3) break;
  }

  return matched.length > 0 ? matched : ['other'];
}

/** Normalises GitHub's language field onto our supported set. */
export function inferLanguage(githubLanguage: string | null): Language | null {
  if (!githubLanguage) return null;

  return LANGUAGE_MAP[githubLanguage.toLowerCase()] ?? 'other';
}

/**
 * Derives searchable tags from GitHub topics.
 *
 * The generic MCP topics every server carries are dropped — a tag present on
 * all 500 servers has no discriminating power and just clutters the card.
 */
export function buildTags(topics: string[], language: Language | null): string[] {
  const noise = new Set([
    'mcp',
    'mcp-server',
    'mcp-servers',
    'model-context-protocol',
    'modelcontextprotocol',
    'claude',
    'ai',
    'llm',
  ]);

  const tags = new Set(
    topics
      .map((topic) => topic.toLowerCase().trim())
      .filter((topic) => topic.length > 1 && topic.length <= 32)
      .filter((topic) => !noise.has(topic)),
  );

  if (language && language !== 'other') tags.add(language);

  return [...tags].slice(0, 12);
}

/**
 * Derives the five quality signals from a repository's file tree.
 *
 * Tree-based rather than content-based on purpose: it needs one API call
 * already being made for other reasons, and it cannot be gamed by a README
 * that merely claims to have tests.
 */
export function deriveQualitySignals(
  tree: GitHubTreeEntry[],
  readmeLength: number,
  language: Language | null,
): QualitySignals {
  const paths = tree.map((entry) => entry.path.toLowerCase());

  const hasLicense = paths.some((path) => /^(licen[cs]e|copying)(\.\w+)?$/.test(path));

  const hasTests = paths.some((path) =>
    /(^|\/)(tests?|__tests__|spec)(\/|$)|\.(test|spec)\.\w+$|_test\.(py|go)$/.test(path),
  );

  const hasCi = paths.some((path) =>
    /^\.github\/workflows\/.+\.ya?ml$|^\.gitlab-ci\.yml$|^\.circleci\/|^\.travis\.yml$|^azure-pipelines\.yml$/.test(
      path,
    ),
  );

  const hasTypes =
    language === 'typescript' ||
    paths.some((path) => path.endsWith('.ts') || path.endsWith('.tsx')) ||
    // Python projects signal type checking through config or a marker file.
    paths.some((path) =>
      /(^|\/)py\.typed$|^mypy\.ini$|^\.mypy\.ini$|^pyrightconfig\.json$/.test(path),
    );

  return { readmeLength, hasLicense, hasTypes, hasTests, hasCi };
}

/**
 * Recognises servers published by the vendor whose product they wrap.
 *
 * Being official is worth 5 Trust Score points, so the list is an explicit
 * allowlist of known-good owners rather than anything heuristic.
 */
const OFFICIAL_OWNERS = new Set([
  'modelcontextprotocol',
  'anthropics',
  'github',
  'cloudflare',
  'stripe',
  'supabase-community',
  'supabase',
  'grafana',
  'elastic',
  'microsoft',
  'aws',
  'awslabs',
  'googleapis',
  'sentry',
  'atlassian',
  'notionhq',
  'slackapi',
  'redis',
  'mongodb-js',
  'neo4j-contrib',
  'jetbrains',
  'e2b-dev',
  'browserbase',
]);

/** True when the repository owner is a recognised first-party publisher. */
export function isOfficialOwner(owner: string): boolean {
  return OFFICIAL_OWNERS.has(owner.toLowerCase());
}

/**
 * Decides whether a repository is actually an MCP server.
 *
 * This is the most consequential filter in the crawler. `topic:mcp` and
 * "mcp server" free-text search surface an enormous amount of adjacent
 * material: MCP *clients*, SDKs, awesome-lists, tutorials, and — worst — large
 * platforms like n8n or Kong that merely integrate with MCP. Those projects
 * legitimately carry MCP topics and legitimately contain the word "server"
 * somewhere, so a keyword match is not enough to tell them apart.
 *
 * The rule is therefore positive rather than negative: a repository must
 * *present itself* as an MCP server, through its name, its topics, or an
 * explicit claim in its description. Mentioning MCP in passing does not
 * qualify. That is strict enough to keep n8n out while still admitting a
 * server named `graphify` whose topics say `mcp-server`.
 */
export function looksLikeMcpServer(
  name: string,
  description: string | null,
  topics: string[],
): boolean {
  const lowerName = name.toLowerCase();
  const lowerTopics = topics.map((topic) => topic.toLowerCase());
  const text = `${name} ${description ?? ''} ${topics.join(' ')}`.toLowerCase();

  // Not a server, whatever else it says about itself.
  const excluded =
    /\b(awesome|awesome-list|curated list|tutorial|example|boilerplate|template|starter|course|blog|dotfiles|cheatsheet|specification|documentation)\b/;
  if (excluded.test(text)) return false;

  // Projects that tag themselves as the client half of the protocol.
  const clientTopics = ['mcp-client', 'mcp-clients', 'mcp-host'];
  const serverTopics = ['mcp-server', 'mcp-servers'];
  const declaresClient = clientTopics.some((topic) => lowerTopics.includes(topic));
  const declaresServer = serverTopics.some((topic) => lowerTopics.includes(topic));
  if (declaresClient && !declaresServer) return false;

  // A client, SDK, or framework is not a server unless it also ships one.
  const isClientOnly = /\b(client|sdk|library|framework|gui|desktop app|ide|editor)\b/.test(text);
  if (isClientOnly && !/\bserver\b/.test(text)) return false;

  // ── Positive evidence: at least one of these must hold ────────────────────

  // 1. The repository names itself after the protocol.
  if (/(^|[-_.])mcp([-_.]|$)/.test(lowerName)) return true;

  // 2. It declares an MCP server topic.
  if (declaresServer) return true;

  // 3. Its description states plainly what it is.
  const declaresInProse =
    /\bmcp[- ]server\b|\bmodel[- ]context[- ]protocol[- ]server\b|\bserver for (the )?(mcp|model context protocol)\b|\ban? mcp\b.*\bserver\b/i;
  if (description && declaresInProse.test(description)) return true;

  // 4. It carries a generic MCP topic *and* calls itself a server in prose.
  const hasMcpTopic = lowerTopics.some((topic) =>
    ['mcp', 'model-context-protocol', 'modelcontextprotocol'].includes(topic),
  );
  if (hasMcpTopic && description && /\bserver\b/i.test(description)) return true;

  return false;
}
