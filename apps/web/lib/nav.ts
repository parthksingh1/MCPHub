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

/** A labelled group of links, rendered as a dropdown on desktop. */
export interface NavGroup {
  label: string;
  links: NavLink[];
}

/**
 * The single source of truth for site navigation.
 *
 * Header, mobile drawer, and footer all read from here, so a page can never be
 * reachable from one and missing from another — which was exactly the "hard to
 * navigate" problem: Rankings, Badges and the legal pages had no route in.
 */
export const PRIMARY_NAV: NavGroup[] = [
  {
    label: 'Explore',
    links: [
      {
        href: '/servers',
        label: 'All servers',
        description: 'Search and filter the full index',
        icon: Boxes,
      },
      {
        href: '/rankings',
        label: 'Daily rankings',
        description: 'Top servers by Trust Score, updated daily',
        icon: Trophy,
      },
      {
        href: '/rankings?view=rising',
        label: 'Rising',
        description: 'Biggest Trust Score gains this week',
        icon: Flame,
      },
      {
        href: '/servers?sort=recent',
        label: 'New',
        description: 'Recently indexed servers',
        icon: Sparkles,
      },
      {
        href: '/categories',
        label: 'Categories',
        description: 'Browse by what a server connects to',
        icon: Layers,
      },
      {
        href: '/compare',
        label: 'Compare',
        description: 'Two servers side by side',
        icon: GitCompare,
      },
    ],
  },
  {
    label: 'Resources',
    links: [
      {
        href: '/trust-score',
        label: 'Trust Score',
        description: 'How every server is rated',
        icon: Award,
      },
      {
        href: '/security',
        label: 'Security',
        description: 'What we scan for, and what we cannot',
        icon: ShieldCheck,
      },
      {
        href: '/badges',
        label: 'Badges',
        description: 'Embed your score in a README',
        icon: BadgeCheck,
      },
      {
        href: '/docs/api',
        label: 'API',
        description: 'Free public API, no key',
        icon: Code2,
      },
      { href: '/blog', label: 'Blog', description: 'Notes on the MCP ecosystem', icon: BookOpen },
    ],
  },
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
