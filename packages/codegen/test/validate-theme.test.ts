import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { HeadingTokens, ThemeDefinition } from '@soribashi/theme';
import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { build } from '../src/build.ts';
import { validateTheme } from '../src/validate-theme.ts';

// createTheme's default semanticTokens merge per-key under any overrides, so
// the fixture palette must cover every neutral shade those defaults reference.
const neutral = {
  '0': 'hsl(0 0% 100%)',
  '50': 'hsl(210 40% 98%)',
  '100': 'hsl(210 40% 96%)',
  '200': 'hsl(214 32% 91%)',
  '400': 'hsl(215 20% 65%)',
  '500': 'hsl(215 16% 47%)',
  '900': 'hsl(222 47% 11%)',
};

function themeWith(overrides: Partial<ThemeDefinition>) {
  return createTheme({
    ...overrides,
    tokens: {
      colors: { neutral },
      radius: { md: '0.5rem' },
      spacing: { md: '1rem' },
      fontSize: { md: '1rem' },
      ...overrides.tokens,
    },
  });
}

describe('validateTheme — semantic token references', () => {
  it('accepts a theme whose refs all resolve (green path)', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'colors.neutral.900', body: 'fontSize.md' },
        surface: {
          default: 'colors.neutral.0',
          floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.0' },
          gutter: 'spacing.md',
        },
        border: { default: 'colors.neutral.500', rounded: 'radius.md' },
        accent: { primary: 'colors.neutral.500' },
      },
    });

    expect(() => validateTheme(theme)).not.toThrow();
  });

  it('allows literal CSS values that do not look like token references', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { accent: '#ff0000' },
        surface: { scrim: 'rgb(0 0 0 / 0.5)' },
        border: { none: 'transparent' },
      },
    });

    expect(() => validateTheme(theme)).not.toThrow();
  });

  it('rejects an unknown token namespace, naming the ref and slot', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'color.neutral.900' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.text\.default/);
    expect(() => validateTheme(theme)).toThrow(/color\.neutral\.900/);
    expect(() => validateTheme(theme)).toThrow(/not a recognized token namespace/);
  });

  it('rejects a colors ref with the wrong arity', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'colors.neutral' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.text\.default/);
    expect(() => validateTheme(theme)).toThrow(/colors\.<family>\.<shade>/);
  });

  it('rejects a ref to a nonexistent color family', () => {
    const theme = themeWith({
      semanticTokens: {
        surface: { default: 'colors.brand.500' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.surface\.default/);
    expect(() => validateTheme(theme)).toThrow(/no color family 'brand'/);
  });

  it('rejects a ref to a nonexistent shade, naming the exact ref and slot', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'colors.neutral.950' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(
      /semanticTokens\.text\.default references colors\.neutral\.950 but scale 'neutral' has no shade '950'/,
    );
  });

  it('rejects a radius/spacing/fontSize ref with a missing key', () => {
    const theme = themeWith({
      semanticTokens: {
        border: { rounded: 'radius.xl' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.border\.rounded/);
    expect(() => validateTheme(theme)).toThrow(/tokens\.radius has no key 'xl'/);
  });

  it('validates the object-form surface foreground slot', () => {
    const theme = themeWith({
      semanticTokens: {
        surface: { floating: { value: 'colors.neutral.900', foreground: 'colors.neutral.999' } },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.surface\.floating\.foreground/);
    expect(() => validateTheme(theme)).toThrow(/no shade '999'/);
  });

  it('validates accent slot refs', () => {
    const theme = themeWith({
      semanticTokens: {
        accent: { primary: 'colors.missing.500' },
      },
    });

    expect(() => validateTheme(theme)).toThrow(/semanticTokens\.accent\.primary/);
  });

  it('aggregates multiple errors into one actionable message', () => {
    const theme = themeWith({
      semanticTokens: {
        text: { default: 'colors.neutral.999', muted: 'bogus.thing' },
      },
    });

    let message = '';
    try {
      validateTheme(theme);
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toContain("no shade '999'");
    expect(message).toContain('bogus.thing');
  });
});

describe('validateTheme — custom-property-unsafe token names', () => {
  it('rejects a color family name with spaces', () => {
    const theme = themeWith({
      tokens: {
        colors: { 'blue gray': { '500': 'hsl(215 16% 47%)' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    expect(() => validateTheme(theme)).toThrow(/'blue gray'/);
    expect(() => validateTheme(theme)).toThrow(/CSS custom property/);
  });

  it('rejects a shade name with unsafe characters', () => {
    const theme = themeWith({
      tokens: {
        colors: { neutral: { '5 0': '#eee' } },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    expect(() => validateTheme(theme)).toThrow(/'5 0'/);
  });

  it('rejects unsafe names in dark color overrides', () => {
    const theme = themeWith({
      dark: { colors: { 'dark family': { '500': '#111' } } },
    });

    expect(() => validateTheme(theme)).toThrow(/'dark family'/);
  });

  it('accepts hyphenated and underscored names', () => {
    const theme = themeWith({
      tokens: {
        colors: {
          neutral,
          'blue-gray': { '500': 'hsl(215 16% 47%)' },
          brand_alt: { '500': '#123' },
        },
        radius: {},
        spacing: {},
        fontSize: {},
      },
    });

    expect(() => validateTheme(theme)).not.toThrow();
  });
});

describe('build — fails on invalid semantic token refs', () => {
  it('rejects with the validation error instead of writing broken CSS', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'soribashi-validate-'));
    try {
      const theme = themeWith({
        semanticTokens: {
          text: { default: 'colors.neutral.999' },
        },
      });

      await expect(build({ theme, output: { css: join(tempDir, 'theme.css') } })).rejects.toThrow(
        /no shade '999'/,
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// A dark-only token has no light value to pair with, so emitCss's pairing
// logic (which walks light and looks up a matching dark entry) never visits
// it — the token would otherwise be silently dropped from the emitted CSS
// entirely, not just from one scheme. Every family that pairValue() handles
// gets a dedicated case here so a future family addition to emitTokenLines
// without a matching validation branch shows up as an obvious gap.
// ---------------------------------------------------------------------------

describe('validateTheme — dark overrides must have a light counterpart', () => {
  it('accepts a dark override of a color shade that light declares (green path)', () => {
    const theme = themeWith({
      dark: { colors: { neutral: { '900': '#eee' } } },
    });
    expect(() => validateTheme(theme)).not.toThrow();
  });

  it('rejects dark overrides for every non-colour family in one aggregated error, because light-dark() is colour-only', () => {
    // Was: "accepts normal dark overrides across every token family the
    // pairing logic handles" and asserted `.not.toThrow()`. That encoded the
    // bug this fix removes: pairValue() used to wrap EVERY family in
    // light-dark(), including radius/spacing/fontSize/etc, which is invalid
    // CSS (light-dark() is a <color> production) and resolved to nothing in
    // both schemes. Inverted: dark.colors is still legal and paired via
    // light-dark(); every other family below must now be rejected.
    const theme = createTheme({
      tokens: {
        // createTheme's default semanticTokens reference every shade in
        // `neutral` (see the fixture comment at the top of this file), so
        // reuse it rather than a minimal palette that would trip unrelated
        // semantic-ref validation errors.
        colors: { neutral },
        radius: { md: '0.5rem' },
        spacing: { md: '1rem' },
        fontSize: { md: '1rem' },
        fontFamily: { sans: 'Inter' },
        fontWeight: { bold: '700' },
        lineHeight: { md: '1.5' },
        shadow: { md: '0 1px 2px black' },
        breakpoint: { md: '48rem' },
        zIndex: { modal: 200 },
        heading: {
          textWrap: 'wrap',
          sizes: {
            h1: { fontSize: '2rem', fontWeight: '700', lineHeight: '1.2' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
      dark: {
        colors: { neutral: { '50': '#111', '0': '#000' } },
        radius: { md: '0.75rem' },
        spacing: { md: '1.25rem' },
        fontSize: { md: '1.05rem' },
        fontFamily: { sans: 'SystemFont' },
        fontWeight: { bold: '600' },
        lineHeight: { md: '1.6' },
        shadow: { md: '0 1px 2px white' },
        breakpoint: { md: '46rem' },
        zIndex: { modal: 300 },
        heading: {
          textWrap: 'balance',
          sizes: {
            h1: { fontSize: '1.875rem', fontWeight: '600', lineHeight: '1.3' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
    });

    let message = '';
    try {
      validateTheme(theme);
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }

    // The colour override is legal (light declares both shades) and must not
    // be blamed.
    expect(message).not.toContain('dark.colors.neutral.50');
    expect(message).not.toContain('dark.colors.neutral.0');

    // Every non-colour family is rejected, one error per leaf, all naming
    // the colour-only rationale.
    expect(message).toContain('dark.radius.md');
    expect(message).toContain('dark.spacing.md');
    expect(message).toContain('dark.fontSize.md');
    expect(message).toContain('dark.fontFamily.sans');
    expect(message).toContain('dark.fontWeight.bold');
    expect(message).toContain('dark.lineHeight.md');
    expect(message).toContain('dark.shadow.md');
    expect(message).toContain('dark.breakpoint.md');
    expect(message).toContain('dark.zIndex.modal');
    expect(message).toContain('dark.heading.textWrap');
    expect(message).toContain('dark.heading.sizes.h1.fontSize');
    expect(message).toContain('dark.heading.sizes.h1.fontWeight');
    expect(message).toContain('dark.heading.sizes.h1.lineHeight');
    expect(message).toMatch(/light-dark\(\) is a colour-only/);
  });

  it('rejects a dark color shade with no light counterpart, naming the path', () => {
    const theme = themeWith({
      dark: { colors: { neutral: { '999': '#eee' } } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.colors\.neutral\.999/);
    expect(() => validateTheme(theme)).toThrow(/dark may only override tokens that light declares/);
  });

  it('rejects a dark color family that light does not declare at all', () => {
    const theme = themeWith({
      dark: { colors: { ghost: { '50': 'red' } } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.colors\.ghost\.50/);
  });

  it('rejects a dark radius override; dark overrides are colour-only', () => {
    const theme = themeWith({
      dark: { radius: { xl: '9999px' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.radius\.xl/);
  });

  it('rejects a dark spacing override; dark overrides are colour-only', () => {
    const theme = themeWith({
      dark: { spacing: { xl: '4rem' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.spacing\.xl/);
  });

  it('rejects a dark fontSize override; dark overrides are colour-only', () => {
    const theme = themeWith({
      dark: { fontSize: { xl: '2rem' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.fontSize\.xl/);
  });

  it('rejects a dark fontFamily override; dark overrides are colour-only', () => {
    const theme = themeWith({
      dark: { fontFamily: { sans: 'SystemFont' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.fontFamily\.sans/);
  });

  it('rejects a dark fontWeight override; dark overrides are colour-only', () => {
    const theme = themeWith({
      tokens: {
        colors: { neutral },
        radius: { md: '0.5rem' },
        spacing: { md: '1rem' },
        fontSize: { md: '1rem' },
        fontWeight: { regular: '400' },
      },
      dark: { fontWeight: { bold: '700' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.fontWeight\.bold/);
  });

  it('rejects a dark lineHeight override; dark overrides are colour-only', () => {
    const theme = themeWith({
      dark: { lineHeight: { md: '1.6' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.lineHeight\.md/);
  });

  it('rejects a dark shadow override; dark overrides are colour-only', () => {
    const theme = themeWith({
      dark: { shadow: { md: '0 1px 2px black' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.shadow\.md/);
  });

  it('rejects a dark breakpoint override; dark overrides are colour-only', () => {
    const theme = themeWith({
      dark: { breakpoint: { giant: '200em' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.breakpoint\.giant/);
  });

  it('rejects a dark zIndex override; dark overrides are colour-only', () => {
    const theme = themeWith({
      dark: { zIndex: { modal: 300 } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.zIndex\.modal/);
  });

  it('rejects a dark heading.textWrap override; dark overrides are colour-only', () => {
    const theme = themeWith({
      tokens: {
        colors: { neutral },
        radius: { md: '0.5rem' },
        spacing: { md: '1rem' },
        fontSize: { md: '1rem' },
        heading: {
          sizes: {
            h1: { fontSize: '2rem' },
            h2: { fontSize: '1.5rem' },
            h3: { fontSize: '1.25rem' },
            h4: { fontSize: '1.125rem' },
            h5: { fontSize: '1rem' },
            h6: { fontSize: '0.875rem' },
          },
        },
      },
      dark: { heading: { textWrap: 'balance' } },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.heading\.textWrap/);
  });

  it('rejects a dark heading size sub-field override; dark overrides are colour-only', () => {
    const sizes = {
      h1: { fontSize: '2rem' },
      h2: { fontSize: '1.5rem' },
      h3: { fontSize: '1.25rem' },
      h4: { fontSize: '1.125rem' },
      h5: { fontSize: '1rem' },
      h6: { fontSize: '0.875rem' },
    };
    const theme = themeWith({
      tokens: {
        colors: { neutral },
        radius: { md: '0.5rem' },
        spacing: { md: '1rem' },
        fontSize: { md: '1rem' },
        heading: { sizes },
      },
      dark: {
        heading: {
          sizes: { ...sizes, h1: { ...sizes.h1, fontWeight: '700' } },
        },
      },
    });
    expect(() => validateTheme(theme)).toThrow(/dark\.heading\.sizes\.h1\.fontWeight/);
  });

  // The guard clauses below (`if (!darkFamily) return`, `value === undefined`
  // skips) have no error to assert, so a careless edit could turn them into
  // false positives silently. Pin the green paths.

  it('accepts an entirely-empty dark object', () => {
    const theme = themeWith({ dark: {} });
    expect(() => validateTheme(theme)).not.toThrow();
  });

  it('accepts empty dark groups (no keys, nothing to reject)', () => {
    const theme = themeWith({
      dark: { colors: {}, radius: {}, spacing: {}, heading: {} },
    });
    expect(() => validateTheme(theme)).not.toThrow();
  });

  it('ignores undefined-valued dark entries (spread residue is not an override)', () => {
    const theme = themeWith({
      dark: {
        colors: { neutral: { '999': undefined } },
        radius: { xl: undefined },
        // The sizes record requires HeadingSize values for all six orders, so
        // an undefined slot only arises at runtime (spreads over partial
        // objects) — cast to build the fixture TS cannot express.
        heading: { sizes: { h1: undefined } as unknown as HeadingTokens['sizes'] },
      },
    });
    expect(() => validateTheme(theme)).not.toThrow();
  });
});

describe('build — fails on dark-only token overrides', () => {
  it('rejects with the validation error instead of writing CSS that silently drops the token', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'soribashi-validate-dark-'));
    try {
      const theme = themeWith({
        dark: { colors: { neutral: { '999': '#eee' } } },
      });

      await expect(build({ theme, output: { css: join(tempDir, 'theme.css') } })).rejects.toThrow(
        /dark\.colors\.neutral\.999/,
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
