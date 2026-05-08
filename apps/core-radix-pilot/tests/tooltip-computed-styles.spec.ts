/**
 * Tooltip recipe — computed-style browser-parity tests.
 *
 * Covers:
 *   1. Default variant — content uses surface.floating (dark in light mode) +
 *      surface.floating-foreground (light) — the inverted "shadcn" tooltip
 *   2. Subtle variant — content uses surface.raised (slight elevation) +
 *      text.default — opt-in for non-inverted look
 *   3. Arrow inherits the same bg as content (both reference --cr-tooltip-bg)
 *   4. Dark mode flips the default variant's foreground pairing
 *
 * Navigation: the pilot app is a SPA with useState routing. Navigate to '/'
 * and click the "Tooltip matrix" nav button — same pattern as Button.parity.spec.ts.
 *
 * Hover technique: Radix Tooltip fires on mouse-enter and dismisses on mouse-leave.
 * Using `.hover()` after `scrollIntoViewIfNeeded()` can inadvertently trigger
 * a mouse-leave event as the internal scroll-then-move sequence briefly leaves
 * the element. Instead we use `element.boundingBox()` + `page.mouse.move()` to
 * land directly at the element center without scroll jitter.
 *
 * Grid layout (4 cols, 2 rows — variant × side):
 *   index 0: default / top     index 1: default / right
 *   index 2: default / bottom  index 3: default / left
 *   index 4: subtle / top      index 5: subtle / right
 *   index 6: subtle / bottom   index 7: subtle / left
 *
 * Placement: apps/core-radix-pilot/tests/ (core-radix-pilot Playwright project,
 * baseURL http://localhost:5174)
 *
 * Run: bunx playwright test apps/core-radix-pilot/tests/tooltip-computed-styles.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Navigate to the Tooltip matrix page via the SPA nav. */
async function gotoTooltipMatrix(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /tooltip matrix/i }).click();
  // Wait for Radix tooltip triggers to appear (they carry data-state)
  await page.waitForSelector('button[data-state]');
}

/**
 * Hover a tooltip trigger by index and wait for the content overlay.
 *
 * Radix Tooltip triggers are buttons with `data-state` attribute.
 * Grid order (4 cols): index 0 = default/top, index 4 = subtle/top.
 *
 * Returns { content } for further assertions.
 */
async function hoverTrigger(
  page: Page,
  index: number,
): Promise<{ content: import('@playwright/test').Locator }> {
  const trigger = page.locator('button[data-state]').nth(index);
  const box = await trigger.boundingBox();
  if (!box) throw new Error(`Trigger at index ${index} has no bounding box — is it off-screen?`);

  // Move mouse directly to element center without a preceding scroll event
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const content = page.locator('.cr-Tooltip-content').first();
  await expect(content).toBeVisible({ timeout: 3000 });
  return { content };
}

/** Parse an rgb/rgba string into its numeric channels. */
function parseRgb(css: string): [number, number, number] {
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`Cannot parse color: "${css}"`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// ─── tests ──────────────────────────────────────────────────────────────────

test.describe('Tooltip — computed styles per variant', () => {

  // ── 1. Default variant: surface.floating + foreground (inverted) ─────────

  test('default variant — content bg uses surface.floating (dark in light mode)', async ({ page }) => {
    await gotoTooltipMatrix(page);
    const { content } = await hoverTrigger(page, 0); // default / top

    const bg = await content.evaluate((el) => getComputedStyle(el).backgroundColor);
    // surface.floating = neutral-900 = hsl(222 47% 11%) → rgb(~15, ~23, ~41)
    // All channels well below 80.
    const [r, g, b] = parseRgb(bg);
    expect(r).toBeLessThan(80);
    expect(g).toBeLessThan(80);
    expect(b).toBeLessThan(80);
  });

  test('default variant — content color uses surface.floating-foreground (light)', async ({ page }) => {
    await gotoTooltipMatrix(page);
    const { content } = await hoverTrigger(page, 0); // default / top

    const color = await content.evaluate((el) => getComputedStyle(el).color);
    // surface.floating-foreground = neutral-0 = hsl(0 0% 100%) → rgb(255, 255, 255)
    const [r, g, b] = parseRgb(color);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeGreaterThan(200);
    expect(b).toBeGreaterThan(200);
  });

  // ── 2. Subtle variant: surface.default + text.default (page-surface) ─────

  test('subtle variant — content bg uses surface.raised (slight elevation)', async ({ page }) => {
    await gotoTooltipMatrix(page);
    const { content } = await hoverTrigger(page, 4); // subtle / top

    const bg = await content.evaluate((el) => getComputedStyle(el).backgroundColor);
    // surface.raised = neutral-100 = hsl(210 40% 96%) → rgb(~241, ~245, ~249)
    // Light gray, all channels well above 230 — visibly distinct from white
    // page bg without being inverted.
    const [r, g, b] = parseRgb(bg);
    expect(r).toBeGreaterThan(230);
    expect(g).toBeGreaterThan(230);
    expect(b).toBeGreaterThan(230);
    // Confirm it's NOT pure white (would mean surface.default)
    expect(r + g + b).toBeLessThan(255 * 3);
  });

  test('subtle variant — content color uses text.default (dark)', async ({ page }) => {
    await gotoTooltipMatrix(page);
    const { content } = await hoverTrigger(page, 4); // subtle / top

    const color = await content.evaluate((el) => getComputedStyle(el).color);
    // text.default = neutral-900 in light mode → dark, all channels < 80
    const [r] = parseRgb(color);
    expect(r).toBeLessThan(80);
  });

  // ── 3. Arrow inherits content bg via --cr-tooltip-bg ─────────────────────

  test('arrow fill equals content bg (both resolved from --cr-tooltip-bg)', async ({ page }) => {
    await gotoTooltipMatrix(page);
    // Use default/top: non-white bg makes a divergence easy to detect
    const { content } = await hoverTrigger(page, 0);

    const arrow = page.locator('.cr-Tooltip-arrow').first();
    await expect(arrow).toBeVisible({ timeout: 3000 });

    // Both should resolve from the same --cr-tooltip-bg custom property.
    // Normalise whitespace before comparing to handle browser formatting variance.
    const [arrowFill, contentBg] = await Promise.all([
      arrow.evaluate((el) => getComputedStyle(el).fill.replace(/\s/g, '')),
      content.evaluate((el) => getComputedStyle(el).backgroundColor.replace(/\s/g, '')),
    ]);

    expect(arrowFill).toBe(contentBg);
  });

  // ── 4. Dark mode flips the default variant's foreground pairing ──────────

  test('dark mode — default variant bg flips to light (foreground pairing inverts)', async ({ page }) => {
    await gotoTooltipMatrix(page);

    // Add .dark to <html> so the portal content (rendered in document.body)
    // picks up dark-mode CSS vars. The theme defines .dark { ... } as a class
    // selector on any ancestor, so adding it to <html> propagates to all
    // descendants including portals.
    await page.evaluate(() => document.documentElement.classList.add('dark'));

    const { content } = await hoverTrigger(page, 0); // default / top

    const bg = await content.evaluate((el) => getComputedStyle(el).backgroundColor);
    // In dark mode: surface.floating = neutral-900 which flips to
    // hsl(210 40% 98%) → rgb(248, 250, 252) — near-white.
    const [r, g, b] = parseRgb(bg);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeGreaterThan(200);
    expect(b).toBeGreaterThan(200);
  });

});
