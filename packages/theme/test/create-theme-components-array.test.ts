import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
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
});
