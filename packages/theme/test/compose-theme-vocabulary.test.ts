import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { defineVocabulary } from '../src/define-vocabulary.ts';

const tokens = { colors: {}, radius: {}, spacing: {}, fontSize: {} };

describe('composeTheme via extends — vocabulary', () => {
  it('child theme overrides base theme vocabulary per-axis', () => {
    const base = createTheme({
      tokens,
      vocabulary: {
        size: defineVocabulary(['xs', 'sm', 'md', 'lg', 'xl']),
        intent: defineVocabulary(['primary', 'secondary']),
      },
    });
    const child = createTheme({
      tokens,
      extends: base,
      vocabulary: {
        intent: defineVocabulary(['safe', 'critical']),
        // size omitted — inherits from base
      },
    });
    expect(child.vocabulary.size.values).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
    expect(child.vocabulary.intent.values).toEqual(['safe', 'critical']);
  });

  it('child theme overrides base theme semanticTokens per-slot', () => {
    const base = createTheme({
      tokens,
      semanticTokens: {
        text: { default: 'colors.gray.900', muted: 'colors.gray.500' },
        surface: { default: 'colors.gray.0' },
        border: { default: 'colors.gray.200' },
      },
    });
    const child = createTheme({
      tokens,
      extends: base,
      semanticTokens: {
        text: { default: 'colors.zinc.900' }, // overrides default; muted inherits
      },
    });
    expect(child.semanticTokens.text.default).toBe('colors.zinc.900');
    expect(child.semanticTokens.text.muted).toBe('colors.gray.500');
    expect(child.semanticTokens.surface.default).toBe('colors.gray.0');
  });
});
