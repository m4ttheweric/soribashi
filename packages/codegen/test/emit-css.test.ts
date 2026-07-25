import { createTheme, defaultTokens } from '@soribashi/theme';
import { describe, expect, it, vi } from 'vitest';
import { emitCss } from '../src/emit-css.ts';

describe('emitCss', () => {
  it('emits :root with all color shade variables', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '50': 'hsl(0 0% 95%)', '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitCss(theme);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary-50: hsl(0 0% 95%);');
    expect(css).toContain('--color-primary-500: hsl(0 0% 50%);');
  });

  it('emits no --__hsl- companion variables', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(217 91% 60%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });
    expect(emitCss(theme)).not.toContain('--__hsl-');
  });

  it('emits oklch colour values verbatim', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'oklch(0.62 0.19 259)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });
    expect(emitCss(theme)).toContain('--color-primary-500: oklch(0.62 0.19 259);');
  });

  it('emits radius, spacing, and fontSize tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: { sm: '0.25rem', md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--radius-sm: 0.25rem;');
    expect(css).toContain('--radius-md: 0.5rem;');
    expect(css).toContain('--spacing-md: 0.5rem;');
    expect(css).toContain('--font-size-md: 1rem;');
  });

  it('emits the dark override as a light-dark() pair in :root, not a restated .dark block', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)' } },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('.dark {');
    expect(css).toContain('--color-primary-500: light-dark(hsl(0 0% 50%), hsl(0 0% 80%));');
    // The .dark block only flips color-scheme now — it does not restate the token.
    const darkBlock = css.slice(css.indexOf('.dark {'));
    expect(darkBlock).not.toContain('--color-primary-500:');
  });

  it('does not restate semantic vars inside .dark — the underlying token already carries both schemes', () => {
    // light-dark() resolves at the point of use against the CONSUMING
    // element's color-scheme, not the declaring element's. So a semantic var
    // declared only in :root (e.g. --surface-canvas: var(--color-neutral-50))
    // still flips correctly under a scoped `.dark` wrapper: --color-neutral-50
    // itself is light-dark(...), and that resolves fresh at every element that
    // reads it, regardless of where the var() indirection was declared.
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '50': '#fafafa', '900': '#111111' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        colors: { neutral: { '50': '#0a0a0a', '900': '#eeeeee' } },
      },
      semanticTokens: {
        surface: { canvas: 'colors.neutral.50' },
      },
    });

    const css = emitCss(theme);
    // The semantic var is declared once in :root, referencing the light-dark() token.
    const rootBlock = css.slice(0, css.indexOf('.dark {'));
    expect(rootBlock).toContain('--surface-canvas: var(--color-neutral-50);');
    expect(rootBlock).toContain('--color-neutral-50: light-dark(#fafafa, #0a0a0a);');

    // The .dark block no longer restates it — that's the whole point of the collapse.
    const darkBlock = css.slice(css.indexOf('.dark {'));
    expect(darkBlock).not.toContain('--surface-canvas:');
  });

  it('.dark block is always emitted with just color-scheme, even when dark holds only empty sections', () => {
    // composeTheme no longer materializes empty dark families, but the
    // emitter no longer conditions block emission on theme.dark contents at
    // all — the .dark selector's only job now is the color-scheme flip — so
    // construct that shape explicitly to prove it still emits cleanly.
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });
    const theme = { ...base, dark: { colors: {}, radius: {}, spacing: {}, fontSize: {} } };

    expect(Object.keys(theme.dark).length).toBeGreaterThan(0);
    const css = emitCss(theme);
    // Wrapped one level deeper inside @layer soribashi.tokens { ... } now.
    expect(css).toContain('.dark {\n    color-scheme: dark;\n  }');
    expect(css).not.toContain('light-dark(');
  });

  it('still emits the light-dark() pair for composed themes with real dark overrides', () => {
    const base = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });
    const extended = createTheme({
      extends: base,
      tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
      dark: { colors: { primary: { '500': 'hsl(0 0% 80%)' } } },
    });

    const css = emitCss(extended);
    expect(css).toContain('.dark {');
    expect(css).toContain('--color-primary-500: light-dark(hsl(0 0% 50%), hsl(0 0% 80%));');
  });

  it('respects custom scope and darkMode selector', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      dark: {
        colors: { primary: { '500': 'hsl(0 0% 80%)' } },
      },
      scope: '.app-scope',
      darkMode: { selector: '.dark .app-scope' },
    });

    const css = emitCss(theme);
    expect(css).toContain('.app-scope {');
    expect(css).toContain('.dark .app-scope {');
    expect(css).not.toContain(':root {');
  });

  it('emits semantic surface vars referencing color tokens', () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '0': '#fff', '100': '#eee' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      semanticTokens: {
        surface: { default: 'colors.neutral.0', raised: 'colors.neutral.100' },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--surface-default: var(--color-neutral-0);');
    expect(css).toContain('--surface-raised: var(--color-neutral-100);');
  });

  it('emits --accent-* vars when semanticTokens.accent is provided (Gap 4)', () => {
    const theme = createTheme({
      tokens: {
        colors: {
          primary: { '500': 'hsl(221 83% 53%)' },
          warning: { '500': 'hsl(38 92% 50%)' },
        },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
      semanticTokens: {
        accent: {
          feedback: 'colors.warning.500',
          brand: 'colors.primary.500',
        },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--accent-feedback: var(--color-warning-500);');
    expect(css).toContain('--accent-brand: var(--color-primary-500);');
  });

  it('does NOT emit --accent-* vars when semanticTokens.accent is omitted (default)', () => {
    const theme = createTheme({
      tokens: {
        colors: { neutral: { '0': '#fff' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    const css = emitCss(theme);
    expect(css).not.toContain('--accent-');
  });

  it('output is deterministic — same theme produces identical output', () => {
    const theme = createTheme({
      tokens: {
        colors: { primary: { '500': 'hsl(0 0% 50%)' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    });

    expect(emitCss(theme)).toBe(emitCss(theme));
  });

  it('begins with the biome-ignore-all suppression, then the auto-generated header comment, when utilities are on (default)', () => {
    // The biome-ignore-all suppression (see emit-css.ts's SUPPRESS_IMPORTANT_LINT_LINE)
    // must be the very first line of the file to take effect, so it precedes
    // the header when utilities are enabled.
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme);
    const lines = css.split('\n');
    expect(lines[0]).toMatch(/biome-ignore-all/);
    expect(lines[1]).toMatch(/auto-generated/i);
  });

  it('begins with the auto-generated header comment when utilities are off (nothing to suppress)', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    const css = emitCss(theme, { utilities: false });
    expect(css.split('\n')[0]).toMatch(/auto-generated/i);
  });

  it('emits font-weight, line-height, font-family-heading vars', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        fontFamily: { sans: 'Inter', heading: 'Georgia' },
        fontWeight: { regular: '400', bold: '700' },
        lineHeight: { md: '1.55' },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain('--font-family-heading: Georgia;');
    expect(css).toContain('--font-weight-regular: 400;');
    expect(css).toContain('--font-weight-bold: 700;');
    expect(css).toContain('--line-height-md: 1.55;');
  });

  it('emits heading sizes per order as separate vars', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        heading: {
          sizes: {
            h1: { fontSize: '2rem', fontWeight: '700', lineHeight: '1.3' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain('--heading-h1-font-size: 2rem;');
    expect(css).toContain('--heading-h1-font-weight: 700;');
    expect(css).toContain('--heading-h1-line-height: 1.3;');
    expect(css).toContain('--heading-h6-font-size: 0.875rem;');
  });

  it('emits --heading-text-wrap when tokens.heading.textWrap is set', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        heading: {
          sizes: {
            h1: { fontSize: '2rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
          textWrap: 'wrap',
        },
      },
    });
    const css = emitCss(theme);
    expect(css).toContain('--heading-text-wrap: wrap;');
  });

  it('does not emit --heading-text-wrap when tokens.heading is absent', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });
    const css = emitCss(theme);
    expect(css).not.toContain('--heading-text-wrap');
  });
});

describe('emitCss — @layer and @property wiring', () => {
  const theme = createTheme({
    tokens: {
      colors: { primary: { '500': 'oklch(0.62 0.19 259)' } },
      radius: { md: '0.5rem' },
      spacing: { cozy: '0.75rem' },
      fontSize: { md: '1rem' },
    },
  });

  it('declares layer order before any layered rule appears', () => {
    const css = emitCss(theme);
    const declarationPos = css.indexOf(
      '@layer soribashi.tokens, soribashi.recipes, soribashi.utilities;',
    );
    const blockPos = css.indexOf('@layer soribashi.tokens {');
    expect(declarationPos).toBeGreaterThan(-1);
    expect(blockPos).toBeGreaterThan(declarationPos);
  });

  it('wraps the :root and .dark blocks inside @layer soribashi.tokens { ... }', () => {
    const css = emitCss(theme);
    const layerStart = css.indexOf('@layer soribashi.tokens {');
    // Assumes emitCss() emits nothing after the layer closes, so its closing
    // brace is the LAST '}' in the file. True today (the layer is the final
    // thing emitted); would need a real matcher if that ever stops holding.
    const layerEnd = css.lastIndexOf('}');
    const rootPos = css.indexOf(':root {');
    const darkPos = css.indexOf('.dark {');
    expect(rootPos).toBeGreaterThan(layerStart);
    expect(rootPos).toBeLessThan(layerEnd);
    expect(darkPos).toBeGreaterThan(layerStart);
    expect(darkPos).toBeLessThan(layerEnd);
  });

  it('registers non-colour tokens as @property inside the layer', () => {
    const css = emitCss(theme);
    expect(css).toContain('@property --radius-md {');
    expect(css).toContain('@property --spacing-cozy {');
    expect(css).toContain('@property --font-size-md {');
    const layerStart = css.indexOf('@layer soribashi.tokens {');
    // Same last-'}'-in-the-file assumption as above.
    const layerEnd = css.lastIndexOf('}');
    expect(css.indexOf('@property --radius-md {')).toBeGreaterThan(layerStart);
    expect(css.indexOf('@property --radius-md {')).toBeLessThan(layerEnd);
  });

  it('NEVER registers a colour token as @property', () => {
    const css = emitCss(theme);
    expect(css).not.toContain('@property --color-primary-500');
  });
});

describe('emitCss with EmitCssOptions.cssVariablesResolver', () => {
  it('appends `root` vars to the :root block', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ root: { '--my-custom': 'red' } }),
    });
    expect(css).toContain('--my-custom: red;');
    // Should be inside the :root block (matches scope), so before first .dark { ... }
    const rootBlock = css.split('.dark')[0]!;
    expect(rootBlock).toContain('--my-custom: red;');
  });

  it('appends `dark` vars to the .dark block', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ dark: { '--my-custom-dark': 'blue' } }),
    });
    expect(css).toContain('--my-custom-dark: blue;');
    const rootBlock = css.split('.dark')[0]!;
    expect(rootBlock).not.toContain('--my-custom-dark:');
  });

  it('consumer var overrides default-emitted var on key conflict (later wins via cascade)', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, {
      cssVariablesResolver: () => ({ root: { '--spacing-md': '99px' } }),
    });
    // Both lines exist in the :root block; the later one (consumer's) is the cascade winner.
    const rootBlock = css.split('.dark')[0]!;
    const lastIndex = rootBlock.lastIndexOf('--spacing-md:');
    const lastLine = rootBlock.substring(lastIndex).split(';')[0]!;
    expect(lastLine).toBe('--spacing-md: 99px');
  });

  it('no resolver passed → emit output is identical to current behavior', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const cssA = emitCss(theme);
    const cssB = emitCss(theme, {});
    expect(cssA).toBe(cssB);
  });

  it('resolver receives the resolved theme', () => {
    const theme = createTheme({ tokens: defaultTokens, name: 'my-theme' });
    let received: { name?: string } | null = null;
    emitCss(theme, {
      cssVariablesResolver: (t) => {
        received = t;
        return {};
      },
    });
    expect(received).not.toBeNull();
    expect((received as { name?: string } | null)?.name).toBe('my-theme');
  });
});

describe('emitCss with EmitCssOptions.removeDefaultVariables', () => {
  it('produces no token vars when theme exactly matches defaults', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, { removeDefaultVariables: true });
    // Should still have the :root shell, but no --spacing-*, --color-*, etc.
    expect(css).not.toContain('--spacing-md:');
    expect(css).not.toContain('--color-primary-500:');
    expect(css).not.toContain('--radius-md:');
  });

  it('produces only overridden vars when one token is overridden', () => {
    const theme = createTheme({
      tokens: { ...defaultTokens, spacing: { ...defaultTokens.spacing, md: '20px' } },
    });
    const css = emitCss(theme, { removeDefaultVariables: true });
    expect(css).toContain('--spacing-md: 20px;');
    expect(css).not.toContain('--spacing-xs:'); // matches default — dedup'd
  });

  it('default (no opts) emits the full theme as before', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: { md: '0.75rem' }, fontSize: { md: '1rem' } },
    });
    const css = emitCss(theme);
    expect(css).toContain('--spacing-md:');
  });

  it('removeDefaultVariables: false is equivalent to omitting opts', () => {
    const theme = createTheme({
      tokens: { colors: {}, radius: {}, spacing: { md: '0.75rem' }, fontSize: { md: '1rem' } },
    });
    const cssA = emitCss(theme, { removeDefaultVariables: false });
    const cssB = emitCss(theme);
    expect(cssA).toBe(cssB);
  });
});

describe('emitCss with EmitCssOptions.removeDefaultVariables warning', () => {
  it('warns loudly when the option removes variables', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const theme = createTheme({ tokens: defaultTokens });
      emitCss(theme, { removeDefaultVariables: true });
      expect(warn).toHaveBeenCalledTimes(1);
      const message = String(warn.mock.calls[0]?.[0]);
      expect(message).toContain('removeDefaultVariables');
      expect(message).toMatch(/baseline stylesheet/i);
    } finally {
      warn.mockRestore();
    }
  });

  it('does not warn when nothing matches the defaults', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const theme = createTheme({
        tokens: {
          colors: { acme: { '500': 'hsl(300 50% 50%)' } },
          radius: {},
          spacing: {},
          fontSize: {},
        },
      });
      // createTheme backfills default breakpoints, which match the dedup
      // baseline and would trigger the warning; strip them so the fixture
      // stays default-free.
      const { breakpoint: _backfilled, ...tokens } = theme.tokens;
      emitCss({ ...theme, tokens }, { removeDefaultVariables: true });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('does not warn when the option is off', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const theme = createTheme({ tokens: defaultTokens });
      emitCss(theme);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe('emitCss zIndex tokens', () => {
  it('emits --z-index-* vars, coercing numeric values to strings', () => {
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        zIndex: { app: 100, modal: '200', max: 9999 },
      },
    });

    const css = emitCss(theme);
    expect(css).toContain('--z-index-app: 100;');
    expect(css).toContain('--z-index-modal: 200;');
    expect(css).toContain('--z-index-max: 9999;');
  });

  it('ignores a dark zIndex override and emits the light value bare, never wrapped in light-dark()', () => {
    // Was: "emits dark zIndex overrides as a light-dark() pair in :root",
    // asserting `light-dark(200, 300)`. That locked in the CRITICAL bug this
    // fix removes: light-dark() is a colour-only CSS function, so wrapping a
    // z-index (a <number>) in it is invalid at computed-value time and the
    // token resolves to `auto` in both schemes. zIndex.modal is now always
    // bare; a valid theme cannot even construct this input, since
    // validateTheme rejects a `dark.zIndex` entry outright (see
    // validate-theme.ts).
    const theme = createTheme({
      tokens: {
        colors: {},
        radius: {},
        spacing: {},
        fontSize: {},
        zIndex: { modal: 200 },
      },
      dark: { zIndex: { modal: 300 } },
    });

    const css = emitCss(theme);
    expect(css).toContain('--z-index-modal: 200;');
    expect(css).not.toContain('light-dark(');
  });
});

describe('emitCss visibility utilities (EmitCssOptions.utilities)', () => {
  it('emits a soribashi.utilities layer with .sb-hidden-from-md guarded by (min-width: 48rem) by default', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme);
    expect(css).toContain('@layer soribashi.utilities {');
    expect(css).toContain('.sb-hidden-from-md');
    expect(css).toContain('(min-width: 48rem)');
  });

  it('covers every declared breakpoint, including 2xl and 3xl', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme);
    for (const key of Object.keys(defaultTokens.breakpoint ?? {})) {
      expect(css).toContain(`.sb-hidden-from-${key}`);
      expect(css).toContain(`.sb-visible-from-${key}`);
    }
  });

  it('utilities layer sits inside the declared layer order', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme);
    const declarationPos = css.indexOf(
      '@layer soribashi.tokens, soribashi.recipes, soribashi.utilities;',
    );
    const utilitiesBlockPos = css.indexOf('@layer soribashi.utilities {');
    expect(declarationPos).toBeGreaterThan(-1);
    expect(utilitiesBlockPos).toBeGreaterThan(declarationPos);
  });

  it('emits sb-light-hidden / sb-dark-hidden using the theme darkMode selector', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme);
    expect(css).toContain('.sb-light-hidden');
    expect(css).toContain('.sb-dark-hidden');
    expect(css).toContain('.dark .sb-light-hidden');
    expect(css).toContain('.dark .sb-dark-hidden');
  });

  it('emitCss(theme, { utilities: false }) emits no .sb- utility class', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, { utilities: false });
    expect(css).not.toContain('@layer soribashi.utilities');
    expect(css).not.toMatch(/\.sb-[a-z-]/);
  });

  it('emits a file-top biome-ignore-all suppression for noImportantStyles when utilities are on', () => {
    // The utility classes' !important is a spec requirement (see
    // emit-visibility.ts), not an accident, so the generated file suppresses
    // biome's noImportantStyles lint rule for itself rather than growing the
    // repo's warning baseline by 20 (one per !important declaration). Must be
    // the file-wide `biome-ignore-all` form (not a block-level `biome-ignore`
    // before @layer, which does not propagate into nested rules) and must sit
    // at the very top of the file to take effect.
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme);
    expect(css.startsWith('/* biome-ignore-all lint/complexity/noImportantStyles:')).toBe(true);
  });

  it('does NOT emit the biome-ignore-all suppression when utilities are off (nothing to suppress)', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, { utilities: false });
    expect(css).not.toContain('biome-ignore-all');
  });

  it('emitCss(theme, { utilities: false }) still declares the layer in the order (so a later opt-in stays valid)', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, { utilities: false });
    expect(css).toContain('@layer soribashi.tokens, soribashi.recipes, soribashi.utilities;');
  });

  it('still emits the full breakpoint set when combined with removeDefaultVariables: utility media queries are not custom-property declarations and must not be deduped away', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const css = emitCss(theme, { removeDefaultVariables: true });
    for (const [key, value] of Object.entries(defaultTokens.breakpoint ?? {})) {
      expect(css).toContain(`.sb-hidden-from-${key}`);
      expect(css).toContain(`(min-width: ${value})`);
    }
  });
});
