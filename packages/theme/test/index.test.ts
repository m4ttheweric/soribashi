import { describe, expect, it } from 'vitest';
import {
  createTheme,
  defaultIntentResolver,
  defaultTokens,
  defaultDarkTokens,
  type ThemeDefinition,
  type ResolvedTheme,
  type IntentResolver,
} from '../src/index.ts';

describe('@soribashi/theme public API', () => {
  it('exports createTheme as a function', () => {
    expect(typeof createTheme).toBe('function');
  });

  it('exports defaultIntentResolver as a function', () => {
    expect(typeof defaultIntentResolver).toBe('function');
  });

  it('exports defaultTokens with colors', () => {
    expect(defaultTokens.colors.primary).toBeDefined();
  });

  it('exports defaultDarkTokens', () => {
    expect(defaultDarkTokens.colors).toBeDefined();
  });

  it('types compile and ResolvedTheme matches createTheme return', () => {
    const def: ThemeDefinition = {
      tokens: {
        colors: { primary: { '500': '#000' } },
        radius: { md: '0.5rem' },
        spacing: { md: '0.5rem' },
        fontSize: { md: '1rem' },
      },
    };
    const theme: ResolvedTheme = createTheme(def);
    const resolver: IntentResolver = theme.intentResolver;
    expect(typeof resolver).toBe('function');
  });
});
