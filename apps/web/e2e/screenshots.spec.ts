import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { test, type Page } from '@playwright/test';

/**
 * Captures the README imagery.
 *
 * Run with `pnpm screenshots`. Output lands in `docs/screenshots/` at the repo
 * root, which is what the README references.
 *
 * These are not assertions — a screenshot run should never fail a build. It
 * exists so the marketing images are reproducible from real data rather than
 * hand-cropped once and left to go stale.
 */

const OUT_DIR = join(process.cwd(), '..', '..', 'docs', 'screenshots');

/** Waits for fonts, images, and entrance animations to finish. */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);

  // The card grid staggers in over ~300ms; capturing mid-animation produces
  // half-faded cards.
  await page.waitForTimeout(900);
}

/** Forces a theme before capture so both variants are deterministic. */
async function setTheme(page: Page, theme: 'dark' | 'light'): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem('theme', value);
  }, theme);
}

/**
 * Hides the Next.js dev-mode indicator.
 *
 * These screenshots are captured against the dev server, which paints a
 * floating badge in the corner. It has no business appearing in the README.
 */
async function hideDevIndicator(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-next-badge-root],
      #__next-build-watcher { display: none !important; }
    `,
  });
}

test.beforeAll(async () => {
  await mkdir(OUT_DIR, { recursive: true });
});

test.describe('screenshots', () => {
  // Generous: the dev server compiles each route on first request, and this
  // walks twelve of them across two themes.
  test.setTimeout(600_000);

  test('capture every marketing surface', async ({ browser }) => {
    for (const theme of ['dark', 'light'] as const) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        colorScheme: theme,
      });

      const page = await context.newPage();
      page.setDefaultNavigationTimeout(180_000);
      await setTheme(page, theme);

      const shots: { path: string; name: string; fullPage?: boolean }[] = [
        { path: '/', name: 'home' },
        { path: '/servers', name: 'browse' },
        { path: '/categories', name: 'categories' },
        { path: '/trust-score', name: 'trust-score' },
        { path: '/submit', name: 'submit' },
      ];

      for (const shot of shots) {
        await page.goto(shot.path);
        await hideDevIndicator(page);
        await settle(page);
        await page.screenshot({
          path: join(OUT_DIR, `${shot.name}-${theme}.png`),
          fullPage: shot.fullPage ?? false,
        });
      }

      // A real server detail page — the highest-traffic surface on the site.
      await page.goto('/servers');
      await settle(page);
      const firstCard = page.locator('article a[href^="/servers/"]').first();
      const href = await firstCard.getAttribute('href');

      if (href) {
        await page.goto(href);
        await hideDevIndicator(page);
        await settle(page);
        await page.screenshot({ path: join(OUT_DIR, `detail-${theme}.png`) });
      }

      // The command palette, open — the signature interaction.
      await page.goto('/');
      await hideDevIndicator(page);
      await settle(page);
      await page.keyboard.press('ControlOrMeta+k');
      await page.getByPlaceholder('Search servers, categories, pages…').fill('postgres');

      // Wait for real results rather than a fixed delay — a timeout races the
      // debounce plus the fetch, and captures the loading skeletons instead.
      await page
        .locator('[cmdk-item]')
        .filter({ hasText: /postgres/i })
        .first()
        .waitFor({ state: 'visible', timeout: 30_000 })
        .catch(() => undefined);
      await page.waitForTimeout(400);

      await page.screenshot({ path: join(OUT_DIR, `command-palette-${theme}.png`) });

      await context.close();
    }
  });
});
