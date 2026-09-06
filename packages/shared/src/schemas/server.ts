import { z } from 'zod';

import { CATEGORIES, LANGUAGES, MCP_CLIENTS, SOURCE_TYPES, TRANSPORTS } from '../constants';

import { serverSecuritySchema } from './security';

/** URL-safe identifier used in `/servers/[slug]`. */
export const slugSchema = z
  .string()
  .min(2)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric, hyphen-separated');

/** Which MCP clients a server is known to work with. */
export const compatibleClientsSchema = z.object(
  Object.fromEntries(MCP_CLIENTS.map((client) => [client, z.boolean().default(false)])) as Record<
    (typeof MCP_CLIENTS)[number],
    z.ZodDefault<z.ZodBoolean>
  >,
);
export type CompatibleClients = z.infer<typeof compatibleClientsSchema>;

/** Ready-to-paste install command per client. */
export const installCommandsSchema = z.object(
  Object.fromEntries(MCP_CLIENTS.map((client) => [client, z.string().optional()])) as Record<
    (typeof MCP_CLIENTS)[number],
    z.ZodOptional<z.ZodString>
  >,
);
export type InstallCommands = z.infer<typeof installCommandsSchema>;

/** A tool the MCP server exposes to the model. */
export const mcpToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

/** What the server exposes over MCP: tools, resources, prompts. */
export const capabilitiesSchema = z.object({
  tools: z.array(mcpToolSchema).default([]),
  resources: z.boolean().default(false),
  prompts: z.boolean().default(false),
});
export type Capabilities = z.infer<typeof capabilitiesSchema>;

/** Health-check state for remotely hosted (non-stdio) servers. */
export const liveStatusSchema = z.object({
  isRemote: z.boolean().default(false),
  endpoint: z.string().url().nullable().default(null),
  lastCheckedAt: z.string().datetime().nullable().default(null),
  isUp: z.boolean().nullable().default(null),
  responseTimeMs: z.number().int().min(0).nullable().default(null),
});
export type LiveStatus = z.infer<typeof liveStatusSchema>;

/** Canonical shape of an indexed MCP server, as returned by the public API. */
export const serverSchema = z.object({
  id: z.string().uuid(),
  slug: slugSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(300),
  longDescription: z.string().nullable(),

  authorName: z.string().nullable(),
  authorGithub: z.string().nullable(),
  authorAvatar: z.string().url().nullable(),
  isOfficial: z.boolean(),

  sourceType: z.enum(SOURCE_TYPES),
  repoUrl: z.string().url(),
  packageName: z.string().nullable(),
  homepageUrl: z.string().url().nullable(),

  categories: z.array(z.enum(CATEGORIES)),
  tags: z.array(z.string()),
  language: z.enum(LANGUAGES).nullable(),
  license: z.string().nullable(),

  compatibleClients: compatibleClientsSchema,
  transport: z.array(z.enum(TRANSPORTS)),
  installCommands: installCommandsSchema,
  capabilities: capabilitiesSchema,

  githubStars: z.number().int().min(0),
  githubForks: z.number().int().min(0),
  githubIssues: z.number().int().min(0),
  lastCommitAt: z.string().datetime().nullable(),
  firstReleaseAt: z.string().datetime().nullable(),
  npmWeeklyDownloads: z.number().int().min(0).nullable(),
  pypiMonthlyDownloads: z.number().int().min(0).nullable(),

  security: serverSecuritySchema,

  trustTotal: z.number().int().min(0).max(100),
  trustMaintenance: z.number().int().min(0).max(25),
  trustPopularity: z.number().int().min(0).max(25),
  trustSecurity: z.number().int().min(0).max(25),
  trustQuality: z.number().int().min(0).max(25),
  trustComputedAt: z.string().datetime().nullable(),

  liveStatus: liveStatusSchema.nullable(),

  ratingAvg: z.number().min(0).max(5),
  ratingCount: z.number().int().min(0),

  featured: z.boolean(),
  verified: z.boolean(),
  deprecated: z.boolean(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  indexedAt: z.string().datetime().nullable(),
});
export type Server = z.infer<typeof serverSchema>;

/** Trimmed server shape used by cards, search results, and list endpoints. */
export const serverSummarySchema = serverSchema.pick({
  id: true,
  slug: true,
  name: true,
  description: true,
  authorName: true,
  authorAvatar: true,
  isOfficial: true,
  repoUrl: true,
  categories: true,
  language: true,
  githubStars: true,
  lastCommitAt: true,
  trustTotal: true,
  ratingAvg: true,
  ratingCount: true,
  featured: true,
  verified: true,
  deprecated: true,
  updatedAt: true,
});
export type ServerSummary = z.infer<typeof serverSummarySchema>;
