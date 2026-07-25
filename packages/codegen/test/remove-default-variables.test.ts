import type { ThemeDefinition } from '@soribashi/theme';
import { createTheme, defaultTokens } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { emitCss } from '../src/emit-css.ts';
import { removeDefaultVariables } from '../src/remove-default-variables.ts';

// Helper to avoid repeating the required-field boilerplate for minimal test themes.
// The defaultTokens shape is rich; most tests only need one or two token groups.
const minTokens = { colors: {}, radius: {}, spacing: {}, fontSize: {} } as const;

describe('removeDefaultVariables', () => {
  it('returns a theme with empty token maps when input matches defaults', () => {
    const theme = createTheme({ tokens: minTokens } as ThemeDefinition);
    const dedup = removeDefaultVariables(theme);
    expect(Object.keys(dedup.tokens.spacing ?? {})).toHaveLength(0);
    expect(Object.keys(dedup.tokens.colors ?? {})).toHaveLength(0);
    expect(Object.keys(dedup.tokens.radius ?? {})).toHaveLength(0);
  });

  it('retains overridden spacing keys', () => {
    const theme = createTheme({
      tokens: { ...minTokens, spacing: { md: '20px' } },
    } as ThemeDefinition);
    const dedup = removeDefaultVariables(theme);
    expect(dedup.tokens.spacing?.md).toBe('20px');
    // Other spacing keys (e.g., xs, sm) match defaults, so they should NOT appear:
    expect(dedup.tokens.spacing?.xs).toBeUndefined();
  });

  it('retains overridden color shade leaves; drops matching ones', () => {
    const theme = createTheme({
      tokens: {
        ...minTokens,
        colors: {
          primary: { 500: '#ff0000' },
        },
      },
    } as unknown as ThemeDefinition);
    const dedup = removeDefaultVariables(theme);
    expect(dedup.tokens.colors?.primary?.['500']).toBe('#ff0000');
  });

  it('retains overridden heading.sizes leaves at the leaf level', () => {
    const theme = createTheme({
      tokens: {
        ...minTokens,
        heading: {
          sizes: {
            h1: { fontSize: '4rem' }, // override only fontSize, not the whole h1
          },
        },
      },
    } as unknown as ThemeDefinition);
    const dedup = removeDefaultVariables(theme);
    expect(dedup.tokens.heading?.sizes?.h1?.fontSize).toBe('4rem');
    // h1.fontWeight, h1.lineHeight match defaults — should be dropped from h1:
    expect(dedup.tokens.heading?.sizes?.h1?.fontWeight).toBeUndefined();
    expect(dedup.tokens.heading?.sizes?.h1?.lineHeight).toBeUndefined();
  });

  it('retains overridden dark token entries', () => {
    const theme = createTheme({
      tokens: minTokens,
      dark: { colors: { primary: { 500: '#0000ff' } } },
    } as unknown as ThemeDefinition);
    const dedup = removeDefaultVariables(theme);
    expect(dedup.dark?.colors?.primary?.['500']).toBe('#0000ff');
  });

  it('preserves scope (the dedup theme keeps its scope name)', () => {
    const theme = createTheme({
      tokens: minTokens,
      name: 'test',
      scope: '.test-theme',
    } as ThemeDefinition);
    const dedup = removeDefaultVariables(theme);
    expect(dedup.scope).toBe('.test-theme');
  });

  // Regression: a dark colour override on an otherwise-default light shade
  // used to vanish entirely. dedupColorScale dropped the light entry (it
  // matched defaultTokens) while dedupPartialTokens kept the dark entry (it
  // did not match defaultDarkTokens); emitTokenLines's pairing then walked
  // light keys only, so the surviving dark entry was never visited and never
  // emitted in either scheme. Fixed by threading the deduped dark colour
  // keys into the light dedup as forced keepers.
  it('retains the light entry for a dark-only-overridden default colour, so the override is not lost', () => {
    // Light stays exactly at the soribashi defaults; only dark.colors.neutral.50
    // is a real (non-default) override.
    const theme = createTheme({
      tokens: defaultTokens,
      dark: { colors: { neutral: { '50': 'oklch(0.15 0 0)' } } },
    });

    const dedup = removeDefaultVariables(theme);
    // The light default value survives (needed as light-dark()'s first arg),
    // even though on its own it's identical to defaultTokens.colors.neutral.50
    // and would normally be dropped.
    expect(dedup.tokens.colors.neutral?.['50']).toBe(defaultTokens.colors.neutral?.['50']);
    // A neutral shade with no dark override is still dropped as normal.
    expect(dedup.tokens.colors.neutral?.['100']).toBeUndefined();
    // The dark override survives too.
    expect(dedup.dark.colors?.neutral?.['50']).toBe('oklch(0.15 0 0)');

    const css = emitCss(dedup);
    expect(css).toContain(
      `--color-neutral-50: light-dark(${defaultTokens.colors.neutral?.['50']}, oklch(0.15 0 0));`,
    );
  });
});
