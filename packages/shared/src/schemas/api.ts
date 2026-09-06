import { z } from 'zod';

import {
  CATEGORIES,
  DEFAULT_PAGE_SIZE,
  LANGUAGES,
  MAX_PAGE_SIZE,
  MCP_CLIENTS,
  SORT_OPTIONS,
} from '../constants';

/** Machine-readable error codes returned by every API route. */
export const API_ERROR_CODES = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'RATE_LIMITED',
  'CONFLICT',
  'INTERNAL',
  'UPSTREAM_UNAVAILABLE',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Uniform error envelope: `{ error: { code, message, details? } }`. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Cursorless page metadata attached to every list response. */
export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasMore: z.boolean(),
});
export type Pagination = z.infer<typeof paginationSchema>;

/**
 * Coerces a repeated or comma-separated query param into a string array.
 * Accepts `?category=a&category=b` and `?category=a,b` alike.
 */
const csvArray = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    (Array.isArray(value) ? value : value.split(','))
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  );

/** Query params accepted by `GET /api/servers` and the browse page. */
export const serverQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: csvArray.pipe(z.array(z.enum(CATEGORIES))).optional(),
  client: csvArray.pipe(z.array(z.enum(MCP_CLIENTS))).optional(),
  language: z.enum(LANGUAGES).optional(),
  license: z.string().trim().max(60).optional(),
  minTrust: z.coerce.number().int().min(0).max(100).optional(),
  verified: z.coerce.boolean().optional(),
  official: z.coerce.boolean().optional(),
  sort: z.enum(SORT_OPTIONS).default('trust'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type ServerQuery = z.infer<typeof serverQuerySchema>;

/** Query params accepted by `GET /api/search`. */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

/** Payload of `GET /api/categories`. */
export const categoryCountSchema = z.object({
  slug: z.enum(CATEGORIES),
  label: z.string(),
  count: z.number().int().min(0),
});
export type CategoryCount = z.infer<typeof categoryCountSchema>;

/** Payload of `GET /api/stats`, powering the homepage stats bar. */
export const siteStatsSchema = z.object({
  totalServers: z.number().int().min(0),
  totalCategories: z.number().int().min(0),
  totalClients: z.number().int().min(0),
  verifiedServers: z.number().int().min(0),
  lastIndexedAt: z.string().datetime().nullable(),
});
export type SiteStats = z.infer<typeof siteStatsSchema>;
