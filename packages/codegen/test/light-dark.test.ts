import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { emitCss } from '../src/emit-css.ts';

const theme = createTheme({
  tokens: {
    colors: { neutral: { '50': 'oklch(0.985 0 0)' } },
    radius: {},
    spacing: {},
    fontSize: {},
  },
  dark: { colors: { neutral: { '50': 'oklch(0.21 0.006 285)' } } },
});

describe('emitCss light-dark', () => {
  it('emits one light-dark() declaration per token that has a dark override', () => {
    const css = emitCss(theme);
    expect(css).toContain(
      '--color-neutral-50: light-dark(oklch(0.985 0 0), oklch(0.21 0.006 285));',
    );
  });

  it('emits a bare value for tokens with no dark override', () => {
    const css = emitCss(
      createTheme({
        tokens: {
          colors: { brand: { '500': 'oklch(0.6 0.2 260)' } },
          radius: {},
          spacing: {},
          fontSize: {},
        },
      }),
    );
    expect(css).toContain('--color-brand-500: oklch(0.6 0.2 260);');
    // Named declaration rather than a whole-output search for `light-dark(`:
    // createTheme's default semantic set contributes one unconditionally
    // (surface.placeholder carries a per-scheme reference), so a whole-output
    // search reports that pair regardless of what this token did.
    expect(css).not.toContain('--color-brand-500: light-dark(');
  });

  it('emits a color-scheme flip instead of restating tokens', () => {
    const css = emitCss(theme);
    expect(css).toContain('color-scheme: dark;');
    // the whole point: the dark selector no longer restates every var
    const darkBlock = css.slice(css.indexOf('color-scheme: dark'));
    expect(darkBlock).not.toContain('--color-neutral-50:');
  });

  it('declares color-scheme: light on the root block, so dark mode has something to flip away from', () => {
    // Nothing asserted this before: deleting the `color-scheme: light;` line
    // in emit-css.ts's :root block failed no test, and its only symptom is
    // dark mode silently never engaging (the UA has no light declaration to
    // override, so it falls back to guessing from the OS/embedder default).
    const css = emitCss(theme);
    const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'));
    expect(rootBlock).toContain('color-scheme: light;');
  });
});
