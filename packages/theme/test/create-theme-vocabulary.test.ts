import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { defineVocabulary } from '../src/define-vocabulary.ts';

const minimalTokens = {
  colors: {},
  radius: {},
  spacing: {},
  fontSize: {},
};

describe('createTheme — vocabulary field', () => {
  it('uses caller-provided vocabulary axes', () => {
    const customSize = defineVocabulary(['compact', 'standard', 'comfortable']);
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: customSize },
    });
    expect(theme.vocabulary.size.values).toEqual(['compact', 'standard', 'comfortable']);
  });

  it('falls back to default vocabularies when an axis is omitted', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['s', 'm', 'l']) },
      // intent + variant omitted → defaults
    });
    expect(theme.vocabulary.size.values).toEqual(['s', 'm', 'l']);
    expect(theme.vocabulary.intent.values).toEqual([
      'primary', 'neutral', 'success', 'warning', 'danger', 'info',
    ]);
    expect(theme.vocabulary.variant.values).toEqual([
      'filled', 'outline', 'subtle', 'ghost', 'link',
    ]);
  });

  it('falls back to all defaults when vocabulary is entirely omitted', () => {
    const theme = createTheme({
      tokens: minimalTokens,
    });
    expect(theme.vocabulary.size.values).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
    expect(theme.vocabulary.intent.values.length).toBe(6);
    expect(theme.vocabulary.variant.values.length).toBe(5);
  });

  it('vocabulary values pass Zod validation through the schema', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['compact', 'standard']) },
    });
    expect(theme.vocabulary.size.schema.safeParse('compact').success).toBe(true);
    expect(theme.vocabulary.size.schema.safeParse('huge').success).toBe(false);
  });
});

describe('createTheme — semanticTokens field', () => {
  it('uses caller-provided semanticTokens', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: {
        text: { default: 'colors.gray.900', muted: 'colors.gray.600' },
        surface: { default: 'colors.gray.0' },
        border: { default: 'colors.gray.200' },
      },
    });
    expect(theme.semanticTokens.text.default).toBe('colors.gray.900');
    expect(theme.semanticTokens.surface.default).toBe('colors.gray.0');
  });

  it('falls back to defaults when semanticTokens omitted', () => {
    const theme = createTheme({ tokens: minimalTokens });
    expect(theme.semanticTokens.text.default).toBe('colors.neutral.900');
    expect(theme.semanticTokens.surface.canvas).toBe('colors.neutral.50');
  });

  it('partial semanticTokens merges with defaults per-key', () => {
    const theme = createTheme({
      tokens: minimalTokens,
      semanticTokens: { text: { default: 'colors.gray.900' } },
    });
    expect(theme.semanticTokens.text.default).toBe('colors.gray.900');
    // surface + border still come from defaults
    expect(theme.semanticTokens.surface.canvas).toBe('colors.neutral.50');
    expect(theme.semanticTokens.border.default).toBe('colors.neutral.200');
  });
});
