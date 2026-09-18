import type { Category } from '@mcphub/shared';

/** Tailwind classes giving one category its icon colour. */
export interface CategoryStyle {
  /** Icon tile: neutral square, coloured glyph. */
  tile: string;
}

/** The shared neutral square every category icon sits on. */
const BASE = 'bg-surface-hover ring-border';

/**
 * One icon colour per category.
 *
 * Colour lives only in the glyph, on a neutral tile — the Linear and Raycast
 * approach. It helps you find a category in a grid without turning the page
 * into a rainbow; cards, chips and tables stay monochrome.
 */
export const CATEGORY_STYLE: Record<Category, CategoryStyle> = {
  database: { tile: `${BASE} text-sky-600 dark:text-sky-400` },
  browser: { tile: `${BASE} text-orange-600 dark:text-orange-400` },
  communication: { tile: `${BASE} text-pink-600 dark:text-pink-400` },
  devtools: { tile: `${BASE} text-emerald-600 dark:text-emerald-400` },
  devops: { tile: `${BASE} text-blue-600 dark:text-blue-400` },
  ai: { tile: `${BASE} text-fuchsia-600 dark:text-fuchsia-400` },
  productivity: { tile: `${BASE} text-amber-600 dark:text-amber-400` },
  files: { tile: `${BASE} text-yellow-600 dark:text-yellow-400` },
  search: { tile: `${BASE} text-cyan-600 dark:text-cyan-400` },
  finance: { tile: `${BASE} text-lime-700 dark:text-lime-400` },
  cloud: { tile: `${BASE} text-indigo-600 dark:text-indigo-400` },
  security: { tile: `${BASE} text-red-600 dark:text-red-400` },
  monitoring: { tile: `${BASE} text-teal-600 dark:text-teal-400` },
  design: { tile: `${BASE} text-rose-600 dark:text-rose-400` },
  data: { tile: `${BASE} text-violet-600 dark:text-violet-400` },
  other: { tile: `${BASE} text-text-muted` },
};
