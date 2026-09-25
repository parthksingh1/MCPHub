import {
  Award,
  BadgeCheck,
  BookOpen,
  Boxes,
  Code2,
  FileText,
  Flame,
  GitCompare,
  Layers,
  LayoutGrid,
  Megaphone,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

/** One destination in the site navigation. */
export interface NavLink {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

/** A labelled group of links (footer columns, mobile menu sections). */
export interface NavGroup {
  label: string;
  links: NavLink[];
}

/**
 * The single source of truth for site navigation.
 *
 * The header is one flat row — every primary destination is a single click,
 * with no menus to open and nothing hidden. Secondary pages live in the footer
 * and the mobile menu, which read the same lists, so nothing can drift.
 */
export const MAIN_NAV: NavLink[] = [
  {
    href: '/servers',
    label: 'Servers',
    description: 'Search and filter every server',
    icon: Boxes,
  },
  {
    href: '/categories',
    label: 'Categories',
    description: 'Browse by what a server connects to',
    icon: LayoutGrid,
  },
  {
    href: '/collections',
    label: 'Collections',
    description: 'Curated stacks for common jobs',
    icon: Layers,
  },
  {
    href: '/rankings',
    label: 'Rankings',
    description: 'Top servers by Trust Score, daily',
    icon: Trophy,
  },
  {
    href: '/trust-score',
    label: 'Trust Score',
    description: 'How every server is rated',
    icon: Award,
  },
];

/** Discovery shortcuts, shown in the footer and mobile menu. */
export const EXPLORE_NAV: NavLink[] = [
  { href: '/servers', label: 'All servers', icon: Boxes },
  { href: '/rankings', label: 'Daily rankings', icon: Trophy },
  { href: '/rankings?view=rising', label: 'Rising this week', icon: Flame },
  { href: '/rankings?view=new', label: 'Newly added', icon: Sparkles },
  { href: '/collections', label: 'Collections', icon: Layers },
  { href: '/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/compare', label: 'Compare', icon: GitCompare },
];

/** Learn-more pages, shown in the footer and mobile menu. */
export const RESOURCE_NAV: NavLink[] = [
  { href: '/trust-score', label: 'Trust Score', icon: Award },
  { href: '/badges', label: 'Badges', icon: BadgeCheck },
  { href: '/security', label: 'Security', icon: ShieldCheck },
  { href: '/docs/api', label: 'Public API', icon: Code2 },
  { href: '/blog', label: 'Blog', icon: BookOpen },
];

/** Promoted, paid placement — separated from rankings, always labelled. */
export const SPOTLIGHT_LINK: NavLink = {
  href: '/spotlight',
  label: 'Spotlight',
  description: 'Sponsored placement, never affects scores',
  icon: Megaphone,
};

/** Legal and policy pages. */
export const LEGAL_NAV: NavLink[] = [
  { href: '/legal/privacy', label: 'Privacy policy', icon: FileText },
  { href: '/legal/terms', label: 'Terms of service', icon: Scale },
  { href: '/legal/removal', label: 'Listing removal' },
  { href: '/legal/sponsored', label: 'Sponsored content' },
  { href: '/security', label: 'Security policy' },
];

/** True when `pathname` is inside the given link's section. */
export function isNavActive(pathname: string, href: string): boolean {
  const base = href.split('?')[0] ?? href;
  return pathname === base || pathname.startsWith(`${base}/`);
}
