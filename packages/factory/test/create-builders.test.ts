import { createTheme, defineVocabulary } from '@soribashi/theme';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSoribashiBuilders } from '../src/create-builders.ts';
import { resetRegistry, resolveVocab } from '../src/vocabulary-registry.ts';

const minimalTokens = { colors: {}, radius: {}, spacing: {}, fontSize: {} };

describe('createSoribashiBuilders', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('returns four builder functions', () => {
    const theme = createTheme({ tokens: minimalTokens });
    const builders = createSoribashiBuilders(theme);
    expect(typeof builders.defineComponent).toBe('function');
    expect(typeof builders.definePolymorphicComponent).toBe('function');
    expect(typeof builders.defineCompound).toBe('function');
    expect(typeof builders.defineGenericComponent).toBe('function');
  });

  it("registers the theme's global vocabulary in the registry", () => {
    const customSize = defineVocabulary(['compact', 'standard']);
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: customSize },
    });
    createSoribashiBuilders(theme);
    expect(resolveVocab('AnyComponent', 'size')).toBe(customSize);
  });

  it('registers per-component vocabularies from theme.components', () => {
    const buttonSize = defineVocabulary(['compact', 'jumbo']);
    const theme = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['xs', 'md', 'xl']) },
      components: [
        {
          __soribashiThemeEntry: true,
          name: 'Button',
          defaultProps: {},
          vocabulary: { size: buttonSize },
        },
      ],
    });
    createSoribashiBuilders(theme);
    expect(resolveVocab('Button', 'size')).toBe(buttonSize);
    expect(resolveVocab('OtherComponent', 'size')?.values).toEqual(['xs', 'md', 'xl']);
  });

  it('is idempotent: a second call replaces registrations rather than merging stale state', () => {
    // First theme: registers a "LegacyButton" with a vocabulary override.
    const themeA = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['s', 'm', 'l']) },
      components: [
        {
          __soribashiThemeEntry: true,
          name: 'LegacyButton',
          defaultProps: {},
          vocabulary: { size: defineVocabulary(['legacy-small', 'legacy-large']) },
        },
      ],
    });
    createSoribashiBuilders(themeA);
    expect(resolveVocab('LegacyButton', 'size')?.values).toEqual(['legacy-small', 'legacy-large']);

    // Second theme: no "LegacyButton" entry. After re-initializing, the legacy
    // registration must NOT survive — the registry should reflect themeB only.
    const themeB = createTheme({
      tokens: minimalTokens,
      vocabulary: { size: defineVocabulary(['xs', 'md', 'xl']) },
    });
    createSoribashiBuilders(themeB);
    // Global vocab updated to themeB's size axis:
    expect(resolveVocab('AnyComponent', 'size')?.values).toEqual(['xs', 'md', 'xl']);
    // Legacy per-component override cleared — falls back to themeB's global:
    expect(resolveVocab('LegacyButton', 'size')?.values).toEqual(['xs', 'md', 'xl']);
  });
});
