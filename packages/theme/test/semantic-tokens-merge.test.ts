import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';

const minimalTokens = {
  colors: {},
  radius: {},
  spacing: {},
  fontSize: {},
};

// Fresh themes and extends-children must share the same merge semantics:
// declaring one key inside a slot may not delete the slot's other defaults.
describe('createTheme: semanticTokens per-key merge over defaults', () => {
  it('fresh theme declaring only surface.brand still has surface.default', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: { surface: { brand: 'colors.primary.500' } },
    });

    expect(theme.semanticTokens.surface.brand).toBe('colors.primary.500');
    expect(theme.semanticTokens.surface.default).toBe('colors.neutral.0');
    expect(theme.semanticTokens.surface.canvas).toBe('colors.neutral.50');
    expect(theme.semanticTokens.surface.raised).toBe('colors.neutral.100');
  });

  it('fresh theme overriding text.default keeps text.muted and text.disabled', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: { text: { default: 'colors.gray.900' } },
    });

    expect(theme.semanticTokens.text.default).toBe('colors.gray.900');
    expect(theme.semanticTokens.text.muted).toBe('colors.neutral.500');
    expect(theme.semanticTokens.text.disabled).toBe('colors.neutral.400');
  });

  it('fresh theme overriding border.strong keeps border.default', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: { border: { strong: 'colors.gray.500' } },
    });

    expect(theme.semanticTokens.border.strong).toBe('colors.gray.500');
    expect(theme.semanticTokens.border.default).toBe('colors.neutral.200');
  });

  it('declared keys always win over defaults', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: { surface: { default: 'colors.gray.0' } },
    });

    expect(theme.semanticTokens.surface.default).toBe('colors.gray.0');
  });

  it('fresh and extends paths produce identical merge results', () => {
    const declaration = { surface: { brand: 'colors.primary.500' } };
    const fresh = createTheme({
      tokens: minimalTokens,
      semanticTokens: declaration,
    });
    const base = createTheme({ tokens: minimalTokens });
    const extended = createTheme({
      extends: base,
      tokens: minimalTokens,
      semanticTokens: declaration,
    });

    expect(fresh.semanticTokens.surface).toEqual(extended.semanticTokens.surface);
  });
});

describe('createTheme: default overlay pairing is scheme-stable', () => {
  it('surface.overlay does not reference the inverting neutral ramp', () => {
    const theme = createTheme({ tokens: minimalTokens });

    // A colors.neutral.* reference would flip near-white under the default
    // dark inversion; the default scrim must stay dark in both schemes.
    expect(theme.semanticTokens.surface.overlay).toBe('hsl(222 47% 11% / 0.6)');
  });
});
