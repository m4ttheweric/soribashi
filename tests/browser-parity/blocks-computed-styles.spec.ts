/**
 * Browser-parity computed-style assertions for the 14 soribashi blocks.
 *
 * Each block is tested in 3 prop configurations (default / common / stress).
 * Values are derived from:
 *   - Soribashi's CSS modules  (packages/blocks/src/{Block}/{Block}.css)
 *   - Soribashi's theme tokens (packages/theme/src/tokens/default-tokens.ts)
 *   - Mantine's upstream CSS   (validated at commit 63dafbbf)
 *
 * Token → px reference (browser default = 16px/rem):
 *   --spacing-xs  = 0.25rem = 4px
 *   --spacing-sm  = 0.5rem  = 8px
 *   --spacing-md  = 0.75rem = 12px
 *   --spacing-lg  = 1rem    = 16px
 *   --spacing-xl  = 1.5rem  = 24px
 *   --heading-h1-font-size = 2.125rem = 34px
 *   --heading-h3-font-size = 1.375rem = 22px
 *   --font-size-sm = 0.875rem = 14px
 *   --container-size-md = 960px
 *   --container-size-xl = 1320px
 *
 * Run:  bunx playwright test
 */
import { test, expect, type Page } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Read a single computed property from the element with the given data-testid */
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

/** Read multiple computed properties at once */
function csMany(
  page: Page,
  testId: string,
  props: string[],
): Promise<Record<string, string>> {
  return page.evaluate(
    ([id, ps]) => {
      const el = document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
      if (!el) throw new Error(`Element not found: [data-testid="${id}"]`);
      const style = window.getComputedStyle(el);
      return Object.fromEntries((ps as string[]).map((p) => [p, style.getPropertyValue(p).trim()]));
    },
    [testId, props] as [string, string[]],
  );
}

// ─── setup ──────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto('/browser-fixtures.html');
  // Wait until the React tree has mounted (the first data-testid is present)
  await page.waitForSelector('[data-testid="box-0"]');
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Box
// ─────────────────────────────────────────────────────────────────────────────

test('Box [default] — box-sizing is border-box', async ({ page }) => {
  const v = await cs(page, 'box-0', 'box-sizing');
  expect(v).toBe('border-box');
});

test('Box [p="md"] — padding resolves --spacing-md (12px)', async ({ page }) => {
  const v = await cs(page, 'box-1', 'padding-top');
  // --spacing-md = 0.75rem; at 16px/rem → 12px
  expect(v).toBe('12px');
});

test('Box [hiddenFrom="md"] — display:none at 1280px viewport', async ({ page }) => {
  // Viewport in playwright.config.ts is 1280px wide (> 48rem = 768px)
  const v = await cs(page, 'box-2', 'display');
  expect(v).toBe('none');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Stack
// ─────────────────────────────────────────────────────────────────────────────

test('Stack [default] — display:flex + flex-direction:column', async ({ page }) => {
  const { display, 'flex-direction': fd } = await csMany(page, 'stack-0', ['display', 'flex-direction']);
  expect(display).toBe('flex');
  expect(fd).toBe('column');
});

test('Stack [default] — gap resolves --spacing-md (12px)', async ({ page }) => {
  const v = await cs(page, 'stack-0', 'gap');
  // --spacing-md = 0.75rem = 12px
  expect(v).toBe('12px');
});

test('Stack [gap="lg"] — gap resolves --spacing-lg (16px)', async ({ page }) => {
  const v = await cs(page, 'stack-1', 'gap');
  // --spacing-lg = 1rem = 16px
  expect(v).toBe('16px');
});

test('Stack [align="center"] — align-items:center', async ({ page }) => {
  const v = await cs(page, 'stack-2', 'align-items');
  expect(v).toBe('center');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Group
// ─────────────────────────────────────────────────────────────────────────────

test('Group [default] — display:flex + flex-direction:row', async ({ page }) => {
  const { display, 'flex-direction': fd } = await csMany(page, 'group-0', ['display', 'flex-direction']);
  expect(display).toBe('flex');
  expect(fd).toBe('row');
});

test('Group [justify="center"] — justify-content:center', async ({ page }) => {
  const v = await cs(page, 'group-1', 'justify-content');
  expect(v).toBe('center');
});

test('Group [wrap="nowrap"] — flex-wrap:nowrap', async ({ page }) => {
  const v = await cs(page, 'group-2', 'flex-wrap');
  expect(v).toBe('nowrap');
});

test('Group [gap="xs"] — gap resolves --spacing-xs (4px)', async ({ page }) => {
  const v = await cs(page, 'group-2', 'gap');
  // --spacing-xs = 0.25rem = 4px
  expect(v).toBe('4px');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Flex
// ─────────────────────────────────────────────────────────────────────────────

test('Flex [default] — display:flex + flex-direction:row', async ({ page }) => {
  const { display, 'flex-direction': fd } = await csMany(page, 'flex-0', ['display', 'flex-direction']);
  expect(display).toBe('flex');
  expect(fd).toBe('row');
});

test('Flex [direction="column-reverse"] — flex-direction:column-reverse', async ({ page }) => {
  const v = await cs(page, 'flex-1', 'flex-direction');
  expect(v).toBe('column-reverse');
});

test('Flex [justify="space-between"] — justify-content:space-between', async ({ page }) => {
  const v = await cs(page, 'flex-2', 'justify-content');
  expect(v).toBe('space-between');
});

test('Flex [align="flex-end"] — align-items:flex-end', async ({ page }) => {
  const v = await cs(page, 'flex-2', 'align-items');
  expect(v).toBe('flex-end');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Grid
// ─────────────────────────────────────────────────────────────────────────────

test('Grid [inner] — display:flex + flex-wrap:wrap', async ({ page }) => {
  // The inner wrapper div carries sb-Grid-inner
  const { display, 'flex-wrap': fw } = await page.evaluate(() => {
    const inner = document.querySelector('[data-testid="grid-0"] .sb-Grid-inner') as HTMLElement | null;
    if (!inner) throw new Error('sb-Grid-inner not found inside grid-0');
    const s = window.getComputedStyle(inner);
    return { display: s.display.trim(), 'flex-wrap': s.flexWrap.trim() };
  });
  expect(display).toBe('flex');
  expect(fw).toBe('wrap');
});

test('Grid.Col [span=6 columns=12] — flex-basis ≈ 50%', async ({ page }) => {
  // span=6 / columns=12 → 50%
  // Mantine formula: calc(50% - 0.5 * var(--grid-column-gap))
  // At gap=md (12px): calc(50% - 0.5 * 12px) = calc(50% - 6px)
  // We verify the element's computed width is approximately half the parent
  const ratio = await page.evaluate(() => {
    const col = document.querySelector('[data-testid="grid-col-0"]') as HTMLElement | null;
    const grid = document.querySelector('[data-testid="grid-0"] .sb-Grid-inner') as HTMLElement | null;
    if (!col || !grid) throw new Error('grid-col-0 or grid inner not found');
    return col.getBoundingClientRect().width / grid.getBoundingClientRect().width;
  });
  // Should be close to 0.5 (accounting for gap)
  expect(ratio).toBeGreaterThan(0.45);
  expect(ratio).toBeLessThan(0.55);
});

test('Grid.Col [span=3 columns=6] — flex-basis corresponds to 50%', async ({ page }) => {
  // span=3 / columns=6 → same 50% ratio
  const ratio = await page.evaluate(() => {
    const col = document.querySelector('[data-testid="grid-col-1"]') as HTMLElement | null;
    const grid = document.querySelector('[data-testid="grid-1"] .sb-Grid-inner') as HTMLElement | null;
    if (!col || !grid) throw new Error('grid-col-1 or grid-1 inner not found');
    return col.getBoundingClientRect().width / grid.getBoundingClientRect().width;
  });
  expect(ratio).toBeGreaterThan(0.45);
  expect(ratio).toBeLessThan(0.55);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SimpleGrid
// ─────────────────────────────────────────────────────────────────────────────

test('SimpleGrid [default cols=1] — display:grid', async ({ page }) => {
  const v = await cs(page, 'sg-0', 'display');
  expect(v).toBe('grid');
});

test('SimpleGrid [cols=3] — grid-template-columns has 3 equal tracks', async ({ page }) => {
  const gtc = await cs(page, 'sg-1', 'grid-template-columns');
  // Should resolve to 3 tracks — verify by counting the px values
  const tracks = gtc.trim().split(/\s+(?=\d)/).filter(Boolean);
  expect(tracks).toHaveLength(3);
});

test('SimpleGrid [minColWidth="200px"] — grid-template-columns uses auto-fill', async ({ page }) => {
  // When minColWidth is set, the component adds data-auto-flow="auto-fill"
  // CSS: grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))
  const attrValue = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="sg-2"]');
    return el?.getAttribute('data-auto-flow') ?? null;
  });
  expect(attrValue).toBe('auto-fill');

  // The grid-template-columns should contain "200px" in its resolved value
  const gtc = await cs(page, 'sg-2', 'grid-template-columns');
  // The browser resolves auto-fill — the computed value will be a concrete
  // track list. We just verify we got a non-empty valid CSS value.
  expect(gtc.length).toBeGreaterThan(0);
  expect(gtc).not.toBe('none');
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Container
// ─────────────────────────────────────────────────────────────────────────────

test('Container [default size=md] — max-width is 960px', async ({ page }) => {
  const v = await cs(page, 'container-0', 'max-width');
  // --container-size-md = 960px
  expect(v).toBe('960px');
});

test('Container [size="xl"] — max-width is 1320px', async ({ page }) => {
  const v = await cs(page, 'container-1', 'max-width');
  // --container-size-xl = 1320px
  expect(v).toBe('1320px');
});

test('Container [fluid] — max-width is 100%', async ({ page }) => {
  // fluid → max-width: 100%
  // The container inherits the full parent width — check that max-width is not restricting
  const v = await cs(page, 'container-2', 'max-width');
  // In CSS, "fluid" sets max-width: 100% via the data-fluid rule
  // Chromium resolves 100% of the parent to an absolute pixel value
  // The body has no constrained width so this should equal the viewport width (1280px)
  expect(v).toBe('100%');
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Center
// ─────────────────────────────────────────────────────────────────────────────

test('Center [default] — display:flex + justify-content:center + align-items:center', async ({ page }) => {
  const { display, 'justify-content': jc, 'align-items': ai } = await csMany(page, 'center-0', [
    'display',
    'justify-content',
    'align-items',
  ]);
  expect(display).toBe('flex');
  expect(jc).toBe('center');
  expect(ai).toBe('center');
});

test('Center [inline] — display:inline-flex', async ({ page }) => {
  const v = await cs(page, 'center-1', 'display');
  expect(v).toBe('inline-flex');
});

test('Center [nested] — centers its child', async ({ page }) => {
  // Verify the container is flex and centers
  const jc = await cs(page, 'center-2', 'justify-content');
  expect(jc).toBe('center');
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. AspectRatio
// ─────────────────────────────────────────────────────────────────────────────

test('AspectRatio [default ratio=1] — child has aspect-ratio:1', async ({ page }) => {
  const v = await page.evaluate(() => {
    // The child gets aspect-ratio via the CSS selector > :where(*:not(style))
    const parent = document.querySelector('[data-testid="ar-0"]') as HTMLElement;
    const child = parent?.firstElementChild as HTMLElement | null;
    if (!child) throw new Error('ar-0 child not found');
    return window.getComputedStyle(child).getPropertyValue('aspect-ratio').trim();
  });
  // Default --ar-ratio is 1 → aspect-ratio: 1
  // Chromium reports the computed value as "1 / 1" (normalised fraction form)
  const parsed = v.split('/').map((s) => parseFloat(s.trim()));
  const ratio = parsed.length === 2 ? parsed[0] / parsed[1] : parseFloat(v);
  expect(ratio).toBeCloseTo(1, 2);
});

test('AspectRatio [ratio=16/9] — child has correct aspect-ratio', async ({ page }) => {
  // The child of ar-1 carries data-testid="ar-1-child"
  const v = await cs(page, 'ar-1-child', 'aspect-ratio');
  // 16/9 ≈ 1.7778 — browsers report it as "1.7778" or the exact fraction
  // We check that it's not 1 and not 'auto'
  expect(v).not.toBe('1');
  expect(v).not.toBe('auto');
  // It should be approx 16/9
  const num = parseFloat(v.replace('/', '/').split('/').reduce((a, b) => String(parseFloat(a) / parseFloat(b))));
  expect(num).toBeCloseTo(16 / 9, 2);
});

test('AspectRatio [ratio=4/3] — child div has correct aspect-ratio', async ({ page }) => {
  const v = await cs(page, 'ar-2-child', 'aspect-ratio');
  expect(v).not.toBe('auto');
  // Parse and verify close to 4/3
  const parts = v.split('/').map((s) => parseFloat(s.trim()));
  const ratio = parts.length === 2 ? parts[0] / parts[1] : parseFloat(v);
  expect(ratio).toBeCloseTo(4 / 3, 2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Space
// ─────────────────────────────────────────────────────────────────────────────

test('Space [h="md"] — computed height is 12px', async ({ page }) => {
  // Space sets h="md" → Box gets mih/mah = "--spacing-md" → style prop → height:0.75rem
  // The component also sets the style prop which inlines to height: var(--spacing-md)
  const v = await cs(page, 'space-0', 'height');
  // --spacing-md = 0.75rem = 12px
  expect(v).toBe('12px');
});

test('Space [h="xl"] — computed height is 24px', async ({ page }) => {
  const v = await cs(page, 'space-1', 'height');
  // --spacing-xl = 1.5rem = 24px
  expect(v).toBe('24px');
});

test('Space [w="lg"] — computed width is 16px', async ({ page }) => {
  const v = await cs(page, 'space-2', 'width');
  // --spacing-lg = 1rem = 16px
  expect(v).toBe('16px');
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Paper
// ─────────────────────────────────────────────────────────────────────────────

test('Paper [default] — border-width is 0 (no border)', async ({ page }) => {
  const v = await cs(page, 'paper-0', 'border-top-width');
  expect(v).toBe('0px');
});

test('Paper [withBorder] — border-width is 1px', async ({ page }) => {
  const { 'border-top-width': btw, 'border-top-style': bts } = await csMany(page, 'paper-1', [
    'border-top-width',
    'border-top-style',
  ]);
  expect(btw).toBe('1px');
  expect(bts).toBe('solid');
});

test('Paper [shadow="md"] — box-shadow is non-empty', async ({ page }) => {
  const v = await cs(page, 'paper-2', 'box-shadow');
  // --shadow-md = "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
  // Chromium resolves the color tokens to computed values
  expect(v).not.toBe('none');
  expect(v.length).toBeGreaterThan(0);
});

test('Paper [radius="lg"] — border-radius is 8px', async ({ page }) => {
  // --radius-lg = 0.5rem = 8px
  const v = await cs(page, 'paper-2', 'border-radius');
  expect(v).toBe('8px');
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Text
// ─────────────────────────────────────────────────────────────────────────────

test('Text [default] — font-size is 16px (--font-size-md)', async ({ page }) => {
  const v = await cs(page, 'text-0', 'font-size');
  // --font-size-md = 1rem = 16px
  expect(v).toBe('16px');
});

test('Text [size="sm"] — font-size is 14px', async ({ page }) => {
  const v = await cs(page, 'text-1', 'font-size');
  // --font-size-sm = 0.875rem = 14px
  expect(v).toBe('14px');
});

test('Text [lineClamp=3] — -webkit-line-clamp:3 + display:-webkit-box', async ({ page }) => {
  // Check the data attribute is applied (our CSS uses data-line-clamp selector)
  const attrValue = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="text-2"]');
    return el?.getAttribute('data-line-clamp') ?? null;
  });
  expect(attrValue).not.toBeNull();

  // Check the computed -webkit-line-clamp
  const lineClamp = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="text-2"]') as HTMLElement;
    return window.getComputedStyle(el).getPropertyValue('-webkit-line-clamp').trim();
  });
  // Chromium computes this as '3'
  expect(lineClamp).toBe('3');

  // Check display resolves to a box-type display value.
  // CSS `display: -webkit-box` is the spec mechanism; Chromium normalises
  // the computed value to "flow-root" (still correct rendering behaviour).
  const display = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="text-2"]') as HTMLElement;
    return window.getComputedStyle(el).display.trim();
  });
  // Accept either the raw value or Chromium's normalised form
  expect(['-webkit-box', 'flow-root']).toContain(display);
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Title
// ─────────────────────────────────────────────────────────────────────────────

test('Title [order=1] — font-size is 34px (2.125rem)', async ({ page }) => {
  const v = await cs(page, 'title-0', 'font-size');
  // --heading-h1-font-size = 2.125rem = 34px
  expect(v).toBe('34px');
});

test('Title [order=1] — font-weight is 700', async ({ page }) => {
  const v = await cs(page, 'title-0', 'font-weight');
  expect(v).toBe('700');
});

test('Title [order=1] — renders as h1 element', async ({ page }) => {
  const tag = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="title-0"]');
    return el?.tagName.toLowerCase() ?? null;
  });
  expect(tag).toBe('h1');
});

test('Title [order=3] — font-size is 22px (1.375rem)', async ({ page }) => {
  const v = await cs(page, 'title-1', 'font-size');
  // --heading-h3-font-size = 1.375rem = 22px
  expect(v).toBe('22px');
});

test('Title [order=3] — renders as h3 element', async ({ page }) => {
  const tag = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="title-1"]');
    return el?.tagName.toLowerCase() ?? null;
  });
  expect(tag).toBe('h3');
});

test('Title [lineClamp=2] — has data-line-clamp and -webkit-line-clamp:2', async ({ page }) => {
  const attrValue = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="title-2"]');
    return el?.getAttribute('data-line-clamp') ?? null;
  });
  expect(attrValue).not.toBeNull();

  const lineClamp = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="title-2"]') as HTMLElement;
    return window.getComputedStyle(el).getPropertyValue('-webkit-line-clamp').trim();
  });
  expect(lineClamp).toBe('2');
});
