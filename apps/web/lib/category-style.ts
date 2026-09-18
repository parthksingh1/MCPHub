import type { Category } from '@mcphub/shared';

/** Tailwind classes giving one category its colour. */
export interface CategoryStyle {
  /** Tinted chip: text, background and border. */
  chip: string;
  /** Icon tile: tinted square behind a category icon. */
  tile: string;
  /** Solid dot, for legends and small markers. */
  dot: string;
}

/**
 * One hue per category, like syntax highlighting in an editor.
 *
 * Colour makes a grid of similar cards scannable at a glance — you spot the
 * database servers before you read a word. Every pair uses the 700 shade on
 * light backgrounds and the 300 shade on dark ones, so chip text stays above
 * WCAG AA in both themes. Classes are written out in full so Tailwind's
 * compiler can see them.
 */
export const CATEGORY_STYLE: Record<Category, CategoryStyle> = {
  database: {
    chip: 'text-sky-700 bg-sky-500/10 border-sky-500/25 dark:text-sky-300',
    tile: 'text-sky-600 bg-sky-500/10 ring-sky-500/20 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  browser: {
    chip: 'text-orange-700 bg-orange-500/10 border-orange-500/25 dark:text-orange-300',
    tile: 'text-orange-600 bg-orange-500/10 ring-orange-500/20 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  communication: {
    chip: 'text-pink-700 bg-pink-500/10 border-pink-500/25 dark:text-pink-300',
    tile: 'text-pink-600 bg-pink-500/10 ring-pink-500/20 dark:text-pink-300',
    dot: 'bg-pink-500',
  },
  devtools: {
    chip: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-300',
    tile: 'text-emerald-600 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  devops: {
    chip: 'text-blue-700 bg-blue-500/10 border-blue-500/25 dark:text-blue-300',
    tile: 'text-blue-600 bg-blue-500/10 ring-blue-500/20 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  ai: {
    chip: 'text-fuchsia-700 bg-fuchsia-500/10 border-fuchsia-500/25 dark:text-fuchsia-300',
    tile: 'text-fuchsia-600 bg-fuchsia-500/10 ring-fuchsia-500/20 dark:text-fuchsia-300',
    dot: 'bg-fuchsia-500',
  },
  productivity: {
    chip: 'text-amber-700 bg-amber-500/10 border-amber-500/25 dark:text-amber-300',
    tile: 'text-amber-600 bg-amber-500/10 ring-amber-500/20 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  files: {
    chip: 'text-yellow-700 bg-yellow-500/10 border-yellow-500/25 dark:text-yellow-300',
    tile: 'text-yellow-600 bg-yellow-500/10 ring-yellow-500/20 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
  search: {
    chip: 'text-cyan-700 bg-cyan-500/10 border-cyan-500/25 dark:text-cyan-300',
    tile: 'text-cyan-600 bg-cyan-500/10 ring-cyan-500/20 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  finance: {
    chip: 'text-lime-700 bg-lime-500/10 border-lime-500/25 dark:text-lime-300',
    tile: 'text-lime-700 bg-lime-500/10 ring-lime-500/20 dark:text-lime-300',
    dot: 'bg-lime-500',
  },
  cloud: {
    chip: 'text-indigo-700 bg-indigo-500/10 border-indigo-500/25 dark:text-indigo-300',
    tile: 'text-indigo-600 bg-indigo-500/10 ring-indigo-500/20 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  security: {
    chip: 'text-red-700 bg-red-500/10 border-red-500/25 dark:text-red-300',
    tile: 'text-red-600 bg-red-500/10 ring-red-500/20 dark:text-red-300',
    dot: 'bg-red-500',
  },
  monitoring: {
    chip: 'text-teal-700 bg-teal-500/10 border-teal-500/25 dark:text-teal-300',
    tile: 'text-teal-600 bg-teal-500/10 ring-teal-500/20 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  design: {
    chip: 'text-rose-700 bg-rose-500/10 border-rose-500/25 dark:text-rose-300',
    tile: 'text-rose-600 bg-rose-500/10 ring-rose-500/20 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  data: {
    chip: 'text-violet-700 bg-violet-500/10 border-violet-500/25 dark:text-violet-300',
    tile: 'text-violet-600 bg-violet-500/10 ring-violet-500/20 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  other: {
    chip: 'text-slate-700 bg-slate-500/10 border-slate-500/25 dark:text-slate-300',
    tile: 'text-slate-600 bg-slate-500/10 ring-slate-500/20 dark:text-slate-300',
    dot: 'bg-slate-500',
  },
};

/** Style for any category string, falling back to neutral for unknown slugs. */
export function categoryStyle(slug: string): CategoryStyle {
  return CATEGORY_STYLE[slug as Category] ?? CATEGORY_STYLE.other;
}
