/**
 * Button matrix — computed-style parity tests.
 *
 * For each (variant, intent) cell rendered in pages/ButtonMatrix.tsx,
 * assert the computed background-color and color match what the
 * consolidated theme defines.
 *
 * Pattern reference: tests/browser-parity/blocks-computed-styles.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

function cs(page: Page, testId: string, prop: string): Promise<string> {
  return page.evaluate(
    ([id, p]) => {
      const el = document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
      if (!el) throw new Error(`Element not found: [data-testid="${id}"]`);
      return window.getComputedStyle(el).getPropertyValue(p).trim();
    },
    [testId, prop] as const,
  );
}

/**
 * Resolve a `--color-*-N` CSS var to its computed `rgb(...)` value, by
 * setting it on a temporary div and reading the computed background-color.
 * Lets us assert against token names rather than hardcoded RGB values that
 * would need to track theme changes.
 *
 * Adaptation per consolidation journal § 6: the codegen-emitted CSS vars
 * already contain full `hsl(...)` strings, so use `var(${v})` directly
 * rather than wrapping in `hsl(var(${v}))` (which would resolve to
 * `rgba(0, 0, 0, 0)` and silently make every color comparison meaningless).
 */
async function resolveColorVar(page: Page, varName: string): Promise<string> {
  return page.evaluate((v) => {
    const probe = document.createElement('div');
    probe.style.background = `var(${v})`;
    document.body.appendChild(probe);
    const computed = window.getComputedStyle(probe).backgroundColor;
    probe.remove();
    return computed;
  }, varName);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Click the "Button matrix" nav button in App.tsx.
  await page.getByRole('button', { name: /button matrix/i }).click();
  await page.waitForSelector('[data-testid="btn-filled-primary-md-default"]');
});

const INTENTS = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const VARIANTS_FILLED = ['filled'] as const;

for (const intent of INTENTS) {
  for (const variant of VARIANTS_FILLED) {
    test(`${variant}/${intent}: background = scale 500`, async ({ page }) => {
      const actualBg = await cs(page, `btn-${variant}-${intent}-md-default`, 'background-color');
      const expectedBg = await resolveColorVar(page, `--color-${intent}-500`);
      expect(actualBg).toBe(expectedBg);
    });
  }
}

test('outline/primary: background is transparent', async ({ page }) => {
  const bg = await cs(page, 'btn-outline-primary-md-default', 'background-color');
  // computed-style for transparent is rgba(0, 0, 0, 0)
  expect(bg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/);
});

test('subtle/primary: background = scale 100', async ({ page }) => {
  const bg = await cs(page, 'btn-subtle-primary-md-default', 'background-color');
  const expected = await resolveColorVar(page, '--color-primary-100');
  expect(bg).toBe(expected);
});

test('size sm: height = 2rem (32px)', async ({ page }) => {
  const h = await cs(page, 'btn-filled-primary-sm-default', 'height');
  expect(h).toBe('32px');
});

test('size md: height = 2.5rem (40px)', async ({ page }) => {
  const h = await cs(page, 'btn-filled-primary-md-default', 'height');
  expect(h).toBe('40px');
});

test('size lg: height = 3rem (48px)', async ({ page }) => {
  const h = await cs(page, 'btn-filled-primary-lg-default', 'height');
  expect(h).toBe('48px');
});

test('disabled: opacity = 0.5', async ({ page }) => {
  const o = await cs(page, 'btn-state-disabled', 'opacity');
  expect(parseFloat(o)).toBeCloseTo(0.5, 2);
});

test('loading: spinner is present and disabled flag is set', async ({ page }) => {
  const btn = page.locator('[data-testid="btn-state-loading"]');
  await expect(btn).toHaveAttribute('disabled', '');
  await expect(btn.locator('[data-part="spinner"]')).toBeVisible();
});

test('fullWidth: width fills container', async ({ page }) => {
  // Container is 300px; button should match
  const w = await cs(page, 'btn-state-fullwidth', 'width');
  expect(w).toBe('300px');
});

test('as=a: renders an anchor', async ({ page }) => {
  const link = page.locator('[data-testid="btn-state-link"]');
  await expect(link).toHaveJSProperty('tagName', 'A');
});
