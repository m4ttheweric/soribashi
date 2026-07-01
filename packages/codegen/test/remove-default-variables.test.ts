import type { ThemeDefinition } from '@soribashi/theme';
import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
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
});
