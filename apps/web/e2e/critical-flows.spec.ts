import { expect, test, type Page } from '@playwright/test';

/**
 * Waits until React has hydrated.
 *
 * The command palette attaches its ⌘K listener in an effect, so a keypress
 * sent before hydration lands on nothing. `ThemeToggle` renders a blank
 * placeholder until it mounts and only then shows a labelled button, which
 * makes its appearance an exact hydration signal — better than an arbitrary
 * sleep.
 */
async function waitForHydration(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: /^Theme:/ })).toBeVisible({ timeout: 30_000 });
}

/**
 * The five flows that must never break.
 *
 * Deliberately not an exhaustive suite. E2E tests are slow and brittle by
 * nature, so these cover only the paths where a regression would make the
 * site useless: finding a server, copying its install command, submitting one,
 * and the two keyboard-driven entry points.
 */

test.describe('Browse → filter → detail → copy install command', () => {
  test('a visitor can find a server and copy its install command', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/servers');
    await expect(page.getByRole('heading', { name: 'Browse MCP servers', level: 1 })).toBeVisible();

    // The grid should be populated from the database, not empty.
    const cards = page.locator('article a[href^="/servers/"]');
    await expect(cards.first()).toBeVisible();
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Applying a category filter must change the URL, so the result is
    // shareable and cacheable.
    await page.getByRole('button', { name: /^Developer Tools/ }).click();
    await expect(page).toHaveURL(/category=devtools/);
    await expect(cards.first()).toBeVisible();

    // Into the detail page.
    const firstCardHref = await cards.first().getAttribute('href');
    await cards.first().click();
    await expect(page).toHaveURL(new RegExp(`${firstCardHref}$`));

    // The install block is the whole point of the page.
    await expect(page.getByRole('heading', { name: 'Install' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Claude Desktop' })).toBeVisible();

    const copyButton = page.getByRole('button', { name: /Copy .* install command/ });
    await copyButton.click();

    // Verify the clipboard actually received the command, not just that the
    // button changed colour.
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard.length).toBeGreaterThan(10);
  });
});

test.describe('Search', () => {
  test('the browse search box filters results and syncs to the URL', async ({ page }) => {
    await page.goto('/servers');

    await page.getByRole('searchbox', { name: 'Search servers' }).fill('postgres');
    await expect(page).toHaveURL(/q=postgres/, { timeout: 10_000 });

    const cards = page.locator('article a[href^="/servers/"]');
    await expect(cards.first()).toBeVisible();
  });
});

test.describe('Command palette', () => {
  test('⌘K opens the palette and navigates to a server', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    await page.keyboard.press('ControlOrMeta+k');
    const input = page.getByPlaceholder('Search servers, categories, pages…');
    await expect(input).toBeVisible();

    await input.fill('postgres');

    // Matched on the query text itself, not on a group heading. `hasText` is
    // case-insensitive, so filtering groups by "Servers" also matches the
    // static "Browse all servers" entry — every real result here contains
    // "postgres", and no static page does.
    const firstResult = page
      .locator('[cmdk-item]')
      .filter({ hasText: /postgres/i })
      .first();

    await expect(firstResult).toBeVisible({ timeout: 30_000 });
    await firstResult.click();

    await expect(page).toHaveURL(/\/servers\/[\w-]+$/, { timeout: 15_000 });
  });

  test('Escape closes the palette', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    await page.keyboard.press('ControlOrMeta+k');

    const input = page.getByPlaceholder('Search servers, categories, pages…');
    await expect(input).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(input).not.toBeVisible();
  });
});

test.describe('Submit', () => {
  test('an unauthenticated visitor is told to sign in rather than failing silently', async ({
    page,
  }) => {
    await page.goto('/submit');

    await page
      .getByLabel('GitHub repository URL')
      .fill('https://github.com/modelcontextprotocol/servers');
    await page.getByRole('button', { name: 'Submit server' }).click();

    // Scoped to the form: Next.js renders its own `role="alert"` route
    // announcer, so an unscoped query matches two elements.
    // What matters is that the user is told why, rather than the form
    // appearing to do nothing.
    await expect(page.locator('form [role="alert"]')).toBeVisible({ timeout: 15_000 });
  });

  test('client-side validation rejects a non-GitHub URL before any request', async ({ page }) => {
    await page.goto('/submit');

    await page.getByLabel('GitHub repository URL').fill('https://example.com/not-a-repo');
    await page.getByRole('button', { name: 'Submit server' }).click();

    await expect(page.locator('form [role="alert"]')).toContainText(/GitHub repository URL/i);
  });
});

test.describe('Accessibility and resilience', () => {
  test('an unknown server slug renders the 404 page, not an error', async ({ page }) => {
    const response = await page.goto('/servers/this-server-does-not-exist-12345');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Nothing connected here' })).toBeVisible();
  });

  test('the skip link is the first thing a keyboard user reaches', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });

  test('the theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const html = page.locator('html');
    const before = await html.getAttribute('class');

    await page.getByRole('button', { name: /^Theme:/ }).click();
    await expect(html).not.toHaveClass(before ?? '');
  });
});
