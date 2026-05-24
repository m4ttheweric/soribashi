import { describe, expect, it, beforeEach } from 'vitest';
import { createTheme, defineVocabulary } from '@soribashi/theme';
import { createSoribashiBuilders } from '../src/create-builders.ts';
import { resolveVocab, resetRegistry } from '../src/vocabulary-registry.ts';

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

  it('registers the theme\'s global vocabulary in the registry', () => {
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
      components: [{
        __soribashiThemeEntry: true,
        name: 'Button',
        defaultProps: {},
        vocabulary: { size: buttonSize },
      }],
    });
    createSoribashiBuilders(theme);
    expect(resolveVocab('Button', 'size')).toBe(buttonSize);
    expect(resolveVocab('OtherComponent', 'size')?.values).toEqual(['xs', 'md', 'xl']);
  });
});
