import { execFile } from 'node:child_process';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { parseGitHubUrl } from '@mcphub/crawler';
import { servers } from '@mcphub/db';
import { computeSecurity } from '@mcphub/scoring';
import type { DependencyAudit, SecurityFinding, ServerSecurity, Severity } from '@mcphub/shared';
import { eq, isNull, lt, or, sql } from 'drizzle-orm';

import { runWorker } from './lib/context';

const run = promisify(execFile);

/** Repositories larger than this are skipped; the clone is not worth it. */
const MAX_REPO_SIZE_KB = 50 * 1024;

/** A repository scanned inside this window is not rescanned. */
const RESCAN_AFTER_DAYS = 7;

/** Hard ceiling on any single external command, in milliseconds. */
const COMMAND_TIMEOUT_MS = 120_000;

/** Maps Semgrep's severity vocabulary onto ours. */
const SEMGREP_SEVERITY: Record<string, Severity> = {
  ERROR: 'high',
  WARNING: 'medium',
  INFO: 'low',
};

/** Shape of the Semgrep JSON output we consume. */
interface SemgrepOutput {
  results: {
    check_id: string;
    path: string;
    start: { line: number };
    extra: {
      message: string;
      severity: string;
      metadata?: { 'mcp-severity'?: string; cwe?: string };
    };
  }[];
  errors: { message: string }[];
}

/** Shape of `npm audit --json` output. */
interface NpmAuditOutput {
  metadata?: {
    vulnerabilities?: Record<string, number>;
  };
}

/** True when a path exists. */
async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs a command, returning its stdout even when it exits non-zero.
 *
 * Every tool here signals findings through the exit code — `semgrep` exits 1
 * when it finds something, `npm audit` exits non-zero when there are
 * advisories — so a non-zero exit is the normal case, not a failure.
 */
async function runTool(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; failed: boolean }> {
  try {
    const { stdout } = await run(command, args, {
      cwd,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 32 * 1024 * 1024,
    });
    return { stdout, failed: false };
  } catch (error) {
    const stdout =
      error && typeof error === 'object' && 'stdout' in error ? String(error.stdout) : '';
    return { stdout, failed: stdout.length === 0 };
  }
}

/** Runs the MCP Semgrep ruleset over a checkout. */
async function runSemgrep(dir: string, rulesPath: string): Promise<SecurityFinding[]> {
  const { stdout, failed } = await runTool(
    'semgrep',
    ['--config', rulesPath, '--json', '--quiet', '--no-git-ignore', '--timeout', '30', '.'],
    dir,
  );

  if (failed || !stdout) return [];

  let output: SemgrepOutput;
  try {
    output = JSON.parse(stdout) as SemgrepOutput;
  } catch {
    return [];
  }

  return output.results.slice(0, 100).map((result) => {
    // The ruleset states its own MCP-specific severity; Semgrep's generic
    // ERROR/WARNING is only the fallback.
    const declared = result.extra.metadata?.['mcp-severity'];
    const severity: Severity =
      declared && ['critical', 'high', 'medium', 'low', 'info'].includes(declared)
        ? (declared as Severity)
        : (SEMGREP_SEVERITY[result.extra.severity] ?? 'low');

    return {
      ruleId: result.check_id,
      severity,
      message: result.extra.message.replace(/\s+/g, ' ').trim(),
      file: result.path,
      line: result.start.line,
      rationale: result.extra.metadata?.cwe,
    };
  });
}

/** Runs the appropriate dependency audit for whatever ecosystem is present. */
async function runDependencyAudit(dir: string): Promise<DependencyAudit> {
  const empty: DependencyAudit = {
    tool: 'none',
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  };

  if (await exists(join(dir, 'package.json'))) {
    const { stdout } = await runTool(
      'npm',
      ['audit', '--json', '--package-lock-only', '--omit=dev'],
      dir,
    );
    if (!stdout) return empty;

    try {
      const output = JSON.parse(stdout) as NpmAuditOutput;
      const counts = output.metadata?.vulnerabilities ?? {};

      return {
        tool: 'npm-audit',
        critical: counts.critical ?? 0,
        high: counts.high ?? 0,
        medium: counts.moderate ?? 0,
        low: counts.low ?? 0,
        total: Object.values(counts).reduce((sum, value) => sum + value, 0),
      };
    } catch {
      return empty;
    }
  }

  const hasPython =
    (await exists(join(dir, 'requirements.txt'))) || (await exists(join(dir, 'pyproject.toml')));

  if (hasPython) {
    const { stdout } = await runTool(
      'pip-audit',
      ['--format', 'json', '--progress-spinner', 'off'],
      dir,
    );
    if (!stdout) return empty;

    try {
      const parsed = JSON.parse(stdout) as { dependencies?: { vulns?: unknown[] }[] };
      const total = (parsed.dependencies ?? []).reduce(
        (sum, dependency) => sum + (dependency.vulns?.length ?? 0),
        0,
      );

      // pip-audit does not classify severity, so everything counts as medium.
      // Overstating a low advisory is safer here than silently ignoring a
      // serious one.
      return { tool: 'pip-audit', critical: 0, high: 0, medium: total, low: 0, total };
    } catch {
      return empty;
    }
  }

  return empty;
}

/**
 * Weekly security scan.
 *
 * Shallow-clones each repository, runs the MCP Semgrep ruleset and a dependency
 * audit, and writes the findings to `servers.security` along with a recomputed
 * security component of the Trust Score.
 *
 * Sharded so the work can be split across parallel GitHub Actions jobs:
 * `SHARD_INDEX` and `SHARD_COUNT` select a disjoint slice of the catalogue,
 * which is what keeps a 500-server scan inside the six-hour job limit.
 */
await runWorker('scan', async ({ db, log }) => {
  const shardIndex = Number.parseInt(process.env.SHARD_INDEX ?? '0', 10);
  const shardCount = Math.max(1, Number.parseInt(process.env.SHARD_COUNT ?? '1', 10));
  const rulesPath = new URL('../../semgrep-rules/', import.meta.url).pathname;

  const cutoff = new Date(Date.now() - RESCAN_AFTER_DAYS * 86_400_000);

  const candidates = await db
    .select({
      id: servers.id,
      slug: servers.slug,
      repoUrl: servers.repoUrl,
      trustMaintenance: servers.trustMaintenance,
      trustPopularity: servers.trustPopularity,
      trustQuality: servers.trustQuality,
    })
    .from(servers)
    .where(
      or(
        isNull(sql`${servers.security} ->> 'lastScanAt'`),
        lt(sql`(${servers.security} ->> 'lastScanAt')::timestamptz`, cutoff),
      ),
    )
    // A stable ordering is what makes the shard split deterministic; without
    // it two shards could scan the same server and miss another entirely.
    .orderBy(servers.id);

  const mine = candidates.filter((_, index) => index % shardCount === shardIndex);
  log.info(`shard ${shardIndex + 1}/${shardCount}: ${mine.length} of ${candidates.length} servers`);

  for (const row of mine) {
    const identity = parseGitHubUrl(row.repoUrl);
    if (!identity) {
      log.count('skipped');
      continue;
    }

    let workdir: string | null = null;

    try {
      workdir = await mkdtemp(join(tmpdir(), 'mcphub-scan-'));
      const checkout = join(workdir, 'repo');

      const clone = await runTool(
        'git',
        [
          'clone',
          '--depth',
          '1',
          '--single-branch',
          '--filter=blob:limit=1m',
          `https://github.com/${identity.owner}/${identity.repo}.git`,
          checkout,
        ],
        workdir,
      );

      if (!(await exists(checkout))) {
        log.error(`clone failed for ${row.slug}${clone.stdout ? `: ${clone.stdout.trim()}` : ''}`);
        continue;
      }

      // Size is checked after the shallow clone rather than before: the
      // GitHub API's `size` field counts full history, which routinely
      // overstates a shallow checkout by an order of magnitude.
      const { stdout: sizeOut } = await runTool('du', ['-sk', checkout], workdir);
      const sizeKb = Number.parseInt(sizeOut.trim().split(/\s+/)[0] ?? '0', 10);

      if (sizeKb > MAX_REPO_SIZE_KB) {
        const security: ServerSecurity = {
          lastScanAt: new Date().toISOString(),
          scanned: false,
          skipReason: `Repository is ${Math.round(sizeKb / 1024)} MB, over the ${
            MAX_REPO_SIZE_KB / 1024
          } MB scan limit`,
          findings: [],
        };

        await db.update(servers).set({ security }).where(eq(servers.id, row.id));
        log.count('skipped');
        continue;
      }

      const findings = await runSemgrep(checkout, rulesPath);
      const dependencyAudit = await runDependencyAudit(checkout);

      const security: ServerSecurity = {
        lastScanAt: new Date().toISOString(),
        scanned: true,
        skipReason: null,
        findings,
        dependencyAudit,
      };

      const trustSecurity = computeSecurity(
        {
          lastCommitAt: null,
          lastReleaseAt: null,
          openIssues: 0,
          stars: 0,
          isOfficial: false,
          npmWeeklyDownloads: null,
          security,
          quality: {
            readmeLength: 0,
            hasLicense: false,
            hasTypes: false,
            hasTests: false,
            hasCi: false,
          },
        },
        new Date(),
      );

      await db
        .update(servers)
        .set({
          security,
          trustSecurity,
          trustTotal: row.trustMaintenance + row.trustPopularity + trustSecurity + row.trustQuality,
          trustComputedAt: new Date(),
        })
        .where(eq(servers.id, row.id));

      const critical = findings.filter((finding) => finding.severity === 'critical').length;
      log.info(
        `${row.slug}: ${findings.length} findings (${critical} critical), ` +
          `${dependencyAudit.total} advisories, security ${trustSecurity}/25`,
      );
      log.count('updated');
    } catch (error) {
      log.error(`scan ${row.slug}: ${error instanceof Error ? error.message : 'unknown'}`);
    } finally {
      if (workdir) await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
});
