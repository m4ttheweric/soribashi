import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { isThemeComponentEntry } from '../src/theme-component-entry.ts';
import type { ThemeComponentEntry } from '../src/index.ts';

const baseTokens = {
  colors: { neutral: { '0': 'hsl(0 0% 100%)' } },
  radius: { md: '0.5rem' },
  spacing: { md: '0.5rem' },
  fontSize: { md: '1rem' },
};

function makeEntry<P>(name: string, defaultProps: Partial<P>): ThemeComponentEntry<P> {
  return { __soribashiThemeEntry: true as const, name, defaultProps };
}

describe('createTheme components array-form normalization', () => {
  it('accepts components as record (legacy form)', () => {
    const theme = createTheme({
      tokens: baseTokens,
      components: {
        Button: { defaultProps: { variant: 'filled' } },
      },
    });
    expect(theme.components.Button).toEqual({ defaultProps: { variant: 'filled' } });
  });

  it('accepts components as array of ThemeComponentEntry (new form)', () => {
    const theme = createTheme({
      tokens: baseTokens,
      components: [
        makeEntry('Button', { variant: 'filled' }),
        makeEntry('TooltipProvider', { delayDuration: 500 }),
      ],
    });
    expect(theme.components.Button).toEqual({ defaultProps: { variant: 'filled' } });
    expect(theme.components.TooltipProvider).toEqual({ defaultProps: { delayDuration: 500 } });
  });

  it('handles empty array', () => {
    const theme = createTheme({
      tokens: baseTokens,
      components: [],
    });
    expect(theme.components).toEqual({});
  });

  it('handles missing components field (defaults to empty record)', () => {
    const theme = createTheme({
      tokens: baseTokens,
    });
    expect(theme.components).toEqual({});
  });

  it('last-write-wins when two entries share a name', () => {
    const theme = createTheme({
      tokens: baseTokens,
      components: [
        makeEntry('Button', { variant: 'filled' }),
        makeEntry('Button', { variant: 'outline' }),
      ],
    });
    expect(theme.components.Button).toEqual({ defaultProps: { variant: 'outline' } });
  });

  it('throws a descriptive error (without itself throwing) for a circular-ref entry', () => {
    // Build a circular-reference object — JSON.stringify would throw on this.
    const circular: Record<string, unknown> = { key: 'value' };
    circular['self'] = circular;

    expect(() =>
      createTheme({
        tokens: baseTokens,
        components: [circular] as any,
      }),
    ).toThrow(/non-ThemeComponentEntry/);
  });

  it('throws a descriptive error for a plain object (non-circular) passed as an entry', () => {
    expect(() =>
      createTheme({
        tokens: baseTokens,
        components: [{ variant: 'filled' }] as any,
      }),
    ).toThrow(/Use Component\.withDefaults/);
  });
});

// ---------------------------------------------------------------------------
// isThemeComponentEntry — brand validation
// ---------------------------------------------------------------------------

describe('isThemeComponentEntry guard', () => {
  it('returns true for a well-formed entry', () => {
    const entry: ThemeComponentEntry = {
      __soribashiThemeEntry: true,
      name: 'Button',
      defaultProps: { variant: 'filled' },
    };
    expect(isThemeComponentEntry(entry)).toBe(true);
  });

  it('returns false for a branded object missing name', () => {
    const malformed = { __soribashiThemeEntry: true, defaultProps: {} };
    expect(isThemeComponentEntry(malformed)).toBe(false);
  });

  it('returns false for a branded object with non-string name', () => {
    const malformed = { __soribashiThemeEntry: true, name: 42, defaultProps: {} };
    expect(isThemeComponentEntry(malformed)).toBe(false);
  });

  it('returns false for a branded object missing defaultProps', () => {
    const malformed = { __soribashiThemeEntry: true, name: 'Button' };
    expect(isThemeComponentEntry(malformed)).toBe(false);
  });

  it('returns false for a branded object with null defaultProps', () => {
    const malformed = { __soribashiThemeEntry: true, name: 'Button', defaultProps: null };
    expect(isThemeComponentEntry(malformed)).toBe(false);
  });

  it('returns false for a branded object with array defaultProps (typeof [] === "object" trap)', () => {
    // Arrays satisfy typeof x === 'object' && x !== null — the guard must also
    // reject arrays via !Array.isArray(v.defaultProps).
    const malformed = { __soribashiThemeEntry: true, name: 'Button', defaultProps: [] };
    expect(isThemeComponentEntry(malformed)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isThemeComponentEntry(null)).toBe(false);
  });

  it('returns false for a non-object primitive', () => {
    expect(isThemeComponentEntry('string')).toBe(false);
    expect(isThemeComponentEntry(42)).toBe(false);
  });
});
