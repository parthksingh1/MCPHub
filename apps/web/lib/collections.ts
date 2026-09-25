import type { Category, ServerQuery } from '@mcphub/shared';
import {
  Bot,
  Building2,
  Cloud,
  Database,
  Globe,
  Rocket,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

/** A curated collection: an editorial theme filled by a live query. */
export interface Collection {
  slug: string;
  title: string;
  /** One line for cards. */
  tagline: string;
  /** A short paragraph for the collection page. */
  description: string;
  icon: LucideIcon;
  /** Which servers belong. Always ranked by Trust Score. */
  filter: {
    category?: Category[];
    official?: boolean;
    minTrust?: number;
  };
}

/**
 * Curated collections — "the best MCP servers for X".
 *
 * The themes are editorial; the members are not. Each collection is a filter
 * over the live index, ranked by Trust Score, so it updates itself as servers
 * improve or decline and nobody can buy their way in.
 */
export const COLLECTIONS: Collection[] = [
  {
    slug: 'coding-agents',
    title: 'Coding agent essentials',
    tagline: 'Give your AI coding assistant real developer tools.',
    description:
      'GitHub, code search, documentation and developer tooling — the servers that make Claude Code, Cursor and friends genuinely useful on a real codebase.',
    icon: Bot,
    filter: { category: ['devtools'], minTrust: 70 },
  },
  {
    slug: 'solo-founder',
    title: 'Solo founder stack',
    tagline: 'Email, docs, payments and chat — the business side, automated.',
    description:
      'Productivity, communication and finance servers for people running a company alone: connect your inbox, notes, calendar and payments to one assistant.',
    icon: Rocket,
    filter: { category: ['productivity', 'communication', 'finance'], minTrust: 65 },
  },
  {
    slug: 'devops-cloud',
    title: 'DevOps & cloud',
    tagline: 'Deploy, observe and operate infrastructure from chat.',
    description:
      'Kubernetes, Docker, Terraform, cloud providers and observability platforms — for engineers who want an assistant that can actually look at production.',
    icon: Cloud,
    filter: { category: ['devops', 'cloud', 'monitoring'], minTrust: 65 },
  },
  {
    slug: 'data-databases',
    title: 'Data & databases',
    tagline: 'Query Postgres, warehouses and spreadsheets in plain English.',
    description:
      'Database and analytics servers that let an assistant inspect schemas, run queries and summarise results — read-only options first.',
    icon: Database,
    filter: { category: ['database', 'data'], minTrust: 65 },
  },
  {
    slug: 'browser-automation',
    title: 'Browser automation',
    tagline: 'Let your assistant browse, click, scrape and test the web.',
    description:
      'Real browsers driven by an assistant: navigation, form filling, screenshots, scraping and end-to-end testing.',
    icon: Globe,
    filter: { category: ['browser'], minTrust: 65 },
  },
  {
    slug: 'research',
    title: 'Search & research',
    tagline: 'Fresh answers from the web, papers and your own documents.',
    description:
      'Web search, site search and research servers that keep an assistant current instead of relying on its training data.',
    icon: Search,
    filter: { category: ['search'], minTrust: 60 },
  },
  {
    slug: 'security',
    title: 'Security toolkit',
    tagline: 'Scanners, secrets and identity, wired into your assistant.',
    description:
      'Vulnerability scanners, secret managers and identity providers — for security engineers and anyone careful about what an agent can touch.',
    icon: ShieldCheck,
    filter: { category: ['security'], minTrust: 60 },
  },
  {
    slug: 'official',
    title: 'Official vendor servers',
    tagline: 'Built and maintained by the company behind the product.',
    description:
      'Servers published by the vendor they integrate with. Not automatically better — but you know who is responsible for them.',
    icon: Building2,
    filter: { official: true },
  },
];

/** Looks up a collection by slug. */
export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((collection) => collection.slug === slug);
}

/** The browse query that fills a collection. */
export function collectionQuery(collection: Collection, pageSize: number): ServerQuery {
  return {
    category: collection.filter.category,
    official: collection.filter.official,
    minTrust: collection.filter.minTrust,
    sort: 'trust',
    page: 1,
    pageSize,
  };
}
