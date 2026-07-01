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
      'primary',
      'neutral',
      'success',
      'warning',
      'danger',
      'info',
    ]);
    expect(theme.vocabulary.variant.values).toEqual([
      'filled',
      'outline',
      'subtle',
      'ghost',
      'link',
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

// ---------------------------------------------------------------------------
// VocabularyOverride resolution in components
// ---------------------------------------------------------------------------

import type { Vocabulary } from '../src/define-vocabulary.ts';
import type { ThemeComponentEntry } from '../src/theme-component-entry.ts';

describe('createTheme — VocabularyOverride resolution in components', () => {
  it('replace-mode: passes Vocabulary directly through normalizeComponents', () => {
    const customVariant = defineVocabulary(['default', 'subtle'] as ['default', 'subtle']);
    const entry: ThemeComponentEntry = {
      __soribashiThemeEntry: true,
      name: 'Tooltip',
      defaultProps: {},
      vocabulary: { variant: customVariant },
    };
    const theme = createTheme({
      tokens: minimalTokens,
      components: [entry],
    });
    const resolved = (theme.components as any).Tooltip;
    expect(resolved).toBeDefined();
    expect(resolved.vocabulary?.variant?.values).toEqual(['default', 'subtle']);
  });

  it('extend-mode: function receives current global vocab and returns new vocabulary', () => {
    const entry: ThemeComponentEntry = {
      __soribashiThemeEntry: true,
      name: 'Button',
      defaultProps: {},
      vocabulary: {
        // Function form — cast to bypass the strict Vocabulary type on the entry
        size: ((current: Vocabulary) => {
          const extended = [...current.values, 'jumbo'] as unknown as [string, ...string[]];
          return defineVocabulary(extended);
        }) as unknown as Vocabulary,
      },
    };
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['xs', 'sm', 'md'] as ['xs', 'sm', 'md']) },
      components: [entry],
    });
    const resolved = (theme.components as any).Button;
    expect(resolved).toBeDefined();
    expect(resolved.vocabulary?.size?.values).toEqual(['xs', 'sm', 'md', 'jumbo']);
  });

  it('axes omitted in the entry do not appear in the resolved component vocabulary', () => {
    // The entry only overrides variant; size + intent should NOT be present in the resolved entry.
    const entry: ThemeComponentEntry = {
      __soribashiThemeEntry: true,
      name: 'Tabs',
      defaultProps: {},
      vocabulary: { variant: defineVocabulary(['underline', 'pills'] as ['underline', 'pills']) },
    };
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['s', 'm', 'l'] as ['s', 'm', 'l']) },
      components: [entry],
    });
    const resolved = (theme.components as any).Tabs;
    expect(resolved.vocabulary?.variant?.values).toEqual(['underline', 'pills']);
    expect(resolved.vocabulary?.size).toBeUndefined();
    expect(resolved.vocabulary?.intent).toBeUndefined();
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

describe('createTheme — normalizeComponents preserves slot overrides', () => {
  it('forwards classNames, styles, vars, and attributes from ThemeComponentEntry', () => {
    const entry = {
      __soribashiThemeEntry: true as const,
      name: 'Button',
      defaultProps: { size: 'standard' as const },
      classNames: { root: 'my-button-root' },
      styles: { root: { color: 'red' } },
      vars: () => ({ root: { '--my-var': 'blue' } }),
      attributes: { root: { 'data-testid': 'tagged' } },
    };
    const theme = createTheme({
      tokens: minimalTokens,
      components: [entry],
    });
    const resolved = theme.components.Button;
    expect(resolved).toBeDefined();
    expect(resolved!.defaultProps).toEqual({ size: 'standard' });
    expect(resolved!.classNames).toEqual({ root: 'my-button-root' });
    expect(resolved!.styles).toEqual({ root: { color: 'red' } });
    expect(typeof resolved!.vars).toBe('function');
    expect(resolved!.attributes).toEqual({ root: { 'data-testid': 'tagged' } });
  });

  it('forwards slot overrides even when no vocabulary override is declared', () => {
    const entry = {
      __soribashiThemeEntry: true as const,
      name: 'Tooltip',
      defaultProps: {},
      classNames: { content: 'my-tooltip-content' },
    };
    const theme = createTheme({
      tokens: minimalTokens,
      components: [entry],
    });
    expect(theme.components.Tooltip).toBeDefined();
    expect(theme.components.Tooltip!.classNames).toEqual({ content: 'my-tooltip-content' });
    expect(theme.components.Tooltip!.vocabulary).toBeUndefined();
  });
});
