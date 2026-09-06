/**
 * Project-wide constants shared by the web app, workers, and CLI.
 * Everything here is a literal tuple so Zod enums and TS unions stay in sync.
 */

/** Canonical category slugs. Servers may belong to several. */
export const CATEGORIES = [
  'database',
  'browser',
  'communication',
  'devtools',
  'devops',
  'ai',
  'productivity',
  'files',
  'search',
  'finance',
  'cloud',
  'security',
  'monitoring',
  'design',
  'data',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Human-readable labels for category slugs. */
export const CATEGORY_LABELS: Record<Category, string> = {
  database: 'Database',
  browser: 'Browser',
  communication: 'Communication',
  devtools: 'Developer Tools',
  devops: 'DevOps',
  ai: 'AI & LLM',
  productivity: 'Productivity',
  files: 'Files & Storage',
  search: 'Search',
  finance: 'Finance',
  cloud: 'Cloud',
  security: 'Security',
  monitoring: 'Monitoring',
  design: 'Design',
  data: 'Data & Analytics',
  other: 'Other',
};

/** MCP client applications we generate install instructions for. */
export const MCP_CLIENTS = [
  'claudeDesktop',
  'claudeCode',
  'cursor',
  'cline',
  'windsurf',
  'vscode',
] as const;
export type McpClient = (typeof MCP_CLIENTS)[number];

/** Human-readable labels for MCP clients. */
export const MCP_CLIENT_LABELS: Record<McpClient, string> = {
  claudeDesktop: 'Claude Desktop',
  claudeCode: 'Claude Code',
  cursor: 'Cursor',
  cline: 'Cline',
  windsurf: 'Windsurf',
  vscode: 'VS Code',
};

/** MCP transport mechanisms a server can expose. */
export const TRANSPORTS = ['stdio', 'http', 'sse'] as const;
export type Transport = (typeof TRANSPORTS)[number];

/** Where a server was discovered / is distributed from. */
export const SOURCE_TYPES = ['github', 'npm', 'pypi'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/** Implementation languages we detect and filter on. */
export const LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'java',
  'csharp',
  'ruby',
  'other',
] as const;
export type Language = (typeof LANGUAGES)[number];

/** Severity levels used by the security scanner. */
export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;
export type Severity = (typeof SEVERITIES)[number];

/** Lifecycle of a user-submitted server. */
export const SUBMISSION_STATUSES = ['pending', 'processing', 'indexed', 'rejected'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/** Why a user flagged a server. */
export const REPORT_REASONS = ['spam', 'malicious', 'broken', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Moderation state of a report. */
export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Background job kinds recorded in `crawl_logs`. */
export const RUN_TYPES = ['crawl', 'scan', 'health', 'refresh'] as const;
export type RunType = (typeof RUN_TYPES)[number];

/** Outcome of a background job run. */
export const RUN_STATUSES = ['success', 'partial', 'failed'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

/** Sort orders exposed by the browse page and public API. */
export const SORT_OPTIONS = ['trust', 'stars', 'recent', 'updated', 'name', 'rating'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Maximum Trust Score, and the ceiling of each of its four components. */
export const TRUST_MAX_TOTAL = 100;
export const TRUST_MAX_COMPONENT = 25;

/** Trust Score band thresholds, used for colour coding across the UI. */
export const TRUST_BANDS = {
  high: 75,
  medium: 50,
} as const;

/** Pagination bounds for the public API. Hard cap protects the free tier. */
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 50;

/**
 * Cache TTLs in seconds, keyed by surface. Mirrored by the ISR `revalidate`
 * exports in the app. Raised globally when LAUNCH_MODE is on.
 */
export const CACHE_TTL = {
  list: 60,
  stats: 60,
  detail: 300,
  search: 60,
  category: 3600,
  blog: 86_400,
} as const;

/** Per-IP rate limits, enforced by @upstash/ratelimit on every API route. */
export const RATE_LIMITS = {
  read: { requests: 100, window: '1 m' },
  write: { requests: 10, window: '1 m' },
  submission: { requests: 3, window: '10 m' },
} as const;
