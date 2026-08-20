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
    // neutral.600 per the controller ruling in create-theme.ts's DEFAULT_TEXT
    // (slice-2-layout task 8): text.muted must clear AA against both
    // surface.canvas and surface.raised, in both schemes; neutral.500 fell
    // short in light scheme (4.490:1 / 4.288:1 against a 4.5:1 floor).
    expect(theme.semanticTokens.text.muted).toBe('colors.neutral.600');
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
    expect(theme.semanticTokens.surface.overlay).toBe('oklch(0.2064 0.0388 265.55 / 0.6)');
  });
});

// The backfill hardcodes `colors.neutral.*` refs, so a palette with no neutral
// ramp fails validation on slots it never wrote. `defaults: false` is the way
// out for a theme that owns its whole semantic layer.
describe('createTheme: semanticTokens.defaults opt-out', () => {
  const ownSemantics = {
    text: { default: 'colors.ink.900' },
    surface: { canvas: 'colors.paper.50' },
    border: { default: 'colors.line.200' },
  };

  it('backfills nothing when defaults is false', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: { defaults: false, ...ownSemantics },
    });

    expect(theme.semanticTokens.text).toEqual(ownSemantics.text);
    expect(theme.semanticTokens.surface).toEqual(ownSemantics.surface);
    expect(theme.semanticTokens.border).toEqual(ownSemantics.border);
  });

  it('leaves a slot the theme declared nothing for empty rather than defaulted', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: { defaults: false, text: { default: 'colors.ink.900' } },
    });

    expect(theme.semanticTokens.surface).toEqual({});
    expect(theme.semanticTokens.border).toEqual({});
  });

  it('defaults: true and an omitted flag both backfill, unchanged', () => {
    const implicit = createTheme({ tokens: minimalTokens, semanticTokens: ownSemantics });
    const explicit = createTheme({
      tokens: minimalTokens,
      semanticTokens: { defaults: true, ...ownSemantics },
    });

    expect(explicit.semanticTokens).toEqual(implicit.semanticTokens);
    expect(implicit.semanticTokens.text.muted).toBe('colors.neutral.600');
    expect(implicit.semanticTokens.surface.raised).toBe('colors.neutral.100');
  });

  it('records the opt-out on the resolved theme, and nothing on an opted-in one', () => {
    const optedOut = createTheme({
      tokens: minimalTokens,
      semanticTokens: { defaults: false, ...ownSemantics },
    });
    const optedIn = createTheme({ tokens: minimalTokens, semanticTokens: ownSemantics });

    // Carried so re-resolving the resolved theme (what `extends` does) cannot
    // silently reinstate the backfill.
    expect(optedOut.semanticTokens.defaults).toBe(false);
    expect(optedIn.semanticTokens).not.toHaveProperty('defaults');
  });

  it('an opted-out base is not re-backfilled by a child that extends it', () => {
    const base = createTheme({
      tokens: minimalTokens,
      semanticTokens: { defaults: false, ...ownSemantics },
    });
    const child = createTheme({
      extends: base,
      tokens: minimalTokens,
      semanticTokens: { surface: { raised: 'colors.paper.100' } },
    });

    expect(child.semanticTokens.text).toEqual(ownSemantics.text);
    expect(child.semanticTokens.surface).toEqual({
      canvas: 'colors.paper.50',
      raised: 'colors.paper.100',
    });
  });

  it('an opted-in base still hands its defaults down through extends', () => {
    const base = createTheme({ tokens: minimalTokens });
    const child = createTheme({ extends: base, tokens: minimalTokens });

    expect(child.semanticTokens.text.muted).toBe('colors.neutral.600');
    expect(child.semanticTokens.border.default).toBe('colors.neutral.200');
  });
});
