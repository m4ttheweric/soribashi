import { createTheme, getRecipeMeta, SoribashiProvider } from '@soribashi/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
// Deep import, deliberately not the codegen package barrel: `emitCss` is pure
// (no filesystem access), but `@soribashi/codegen`'s index.ts re-exports
// `watch.ts`, which pulls in `node:fs`/`node:child_process`. Importing the
// barrel here would drag that into the browser test bundle.
import { emitCss } from '../../../codegen/src/emit-css.ts';
import * as barrel from '../index.ts';
import { uiTheme } from '../theme.ts';
import { RESKIN_FIXTURES } from './reskin-fixtures.tsx';

/**
 * Tier 2 conformance gate (spec section 8): a recipe must be fully
 * re-skinnable through the theme alone, with zero recipe-code edits. Proven
 * here by rendering each recipe's fixture twice: once under the library's
 * own `uiTheme`, once under a second, garish theme ("themeB") scoped to a
 * `.reskin-b` wrapper, asserting that at least one of
 * background-color/color/border-radius differs on the recipe's representative
 * slot. The only thing that changes between the two renders is which theme's
 * CSS custom properties are in scope; no recipe source is touched.
 *
 * Full colour coverage matches the shade list `packages/codegen/test/
 * validate-theme.test.ts` uses to satisfy createTheme's default semantic
 * tokens (text/surface/border all resolve through these `neutral` shades),
 * plus a `primary` scale (500 + foreground) for Button's `filled` variant,
 * which is the only variant/intent pair either fixture exercises.
 */
const RESKIN_B_NEUTRAL = {
  '0': 'oklch(0.97 0.05 330)',
  '50': 'oklch(0.92 0.08 330)',
  '100': 'oklch(0.85 0.1 330)',
  '200': 'oklch(0.75 0.14 330)',
  '400': 'oklch(0.55 0.22 330)',
  '500': 'oklch(0.45 0.24 330)',
  '900': 'oklch(0.15 0.1 330)',
};

const RESKIN_B_PRIMARY = {
  '500': 'oklch(0.5 0.28 320)',
  foreground: 'oklch(0.98 0.02 320)',
};

const reskinBTheme = createTheme({
  name: 'reskin-b',
  scope: '.reskin-b',
  tokens: {
    colors: { neutral: RESKIN_B_NEUTRAL, primary: RESKIN_B_PRIMARY },
    // Radius all zero: the single sharpest possible visual contrast against
    // the default theme's rounded corners.
    radius: { sm: '0px', md: '0px', lg: '0px', xl: '0px', '2xl': '0px', full: '0px' },
    // Doubled against @soribashi/theme's defaultTokens.spacing, so the
    // scoped stylesheet is a genuinely different-looking theme end to end,
    // not just a palette swap, even though only colour/radius are asserted.
    spacing: { xs: '0.5rem', sm: '1rem', md: '1.5rem', lg: '2rem', xl: '3rem' },
    fontSize: { sm: '0.875rem', md: '1rem' },
  },
});

let styleEl: HTMLStyleElement;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = emitCss(reskinBTheme);
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

/** Waits a frame or two for a portalled slot (e.g. Popover's popup) to mount. */
async function locateTarget(container: HTMLElement): Promise<HTMLElement> {
  return vi.waitUntil(() => container.querySelector<HTMLElement>('.reskin-target'), {
    timeout: 2000,
    interval: 20,
  });
}

interface SlotSnapshot {
  backgroundColor: string;
  color: string;
  borderRadius: string;
}

function snapshot(el: HTMLElement): SlotSnapshot {
  const cs = getComputedStyle(el);
  return { backgroundColor: cs.backgroundColor, color: cs.color, borderRadius: cs.borderRadius };
}

describe('reskin guard', () => {
  it('every barrel export carrying recipeMeta has a RESKIN_FIXTURES entry', () => {
    const missing: string[] = [];
    for (const value of Object.values(barrel)) {
      const meta = getRecipeMeta(value);
      if (!meta) continue;
      if (!(meta.name in RESKIN_FIXTURES)) missing.push(meta.name);
    }
    expect(
      missing,
      `Missing reskin-fixtures.tsx entries for: ${missing.join(', ')}. Add a RESKIN_FIXTURES[name] fixture in packages/ui/src/conformance/reskin-fixtures.tsx.`,
    ).toEqual([]);
  });
});

describe.each(Object.keys(RESKIN_FIXTURES))('%s theme-only re-skin', (name) => {
  it('re-anchors background-color, color, or border-radius purely via the .reskin-b scope', async () => {
    const fixture = RESKIN_FIXTURES[name]!;

    const baseContainer = document.createElement('div');
    document.body.appendChild(baseContainer);
    const baseScreen = await render(
      <SoribashiProvider theme={uiTheme}>{fixture(baseContainer)}</SoribashiProvider>,
      { container: baseContainer },
    );
    const baseTarget = await locateTarget(baseContainer);
    const base = snapshot(baseTarget);
    await baseScreen.unmount();
    baseContainer.remove();

    const reskinContainer = document.createElement('div');
    reskinContainer.className = 'reskin-b';
    document.body.appendChild(reskinContainer);
    const reskinScreen = await render(
      <SoribashiProvider theme={reskinBTheme}>{fixture(reskinContainer)}</SoribashiProvider>,
      { container: reskinContainer },
    );
    const reskinTarget = await locateTarget(reskinContainer);
    const reskin = snapshot(reskinTarget);
    await reskinScreen.unmount();
    reskinContainer.remove();

    const changed =
      base.backgroundColor !== reskin.backgroundColor ||
      base.color !== reskin.color ||
      base.borderRadius !== reskin.borderRadius;

    expect(
      changed,
      `expected at least one of backgroundColor/color/borderRadius to differ for "${name}" between the base theme and themeB.\nbase:   ${JSON.stringify(base)}\nreskin: ${JSON.stringify(reskin)}`,
    ).toBe(true);
  });
});
