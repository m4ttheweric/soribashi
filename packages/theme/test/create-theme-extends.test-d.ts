import { describe, expectTypeOf, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
import { defineVocabulary } from '../src/define-vocabulary.ts';
import type { Vocabulary } from '../src/define-vocabulary.ts';

const fullTokens = {
  colors: {},
  radius: {},
  spacing: {},
  fontSize: {},
};

type DefaultSize = Vocabulary<'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
type DefaultVariant = Vocabulary<'filled' | 'outline' | 'subtle' | 'ghost' | 'link'>;

describe('createTheme + extends vocabulary typing', () => {
  it('omitted axes inherit the BASE vocabulary literals, not the defaults', () => {
    const base = createTheme({
      tokens: fullTokens,
      vocabulary: { intent: defineVocabulary(['brand', 'accent']) },
    });
    const child = createTheme({ extends: base, tokens: fullTokens });

    // Runtime inherits the base's intent axis; the type must say the same.
    expectTypeOf(child.vocabulary.intent).toEqualTypeOf<Vocabulary<'brand' | 'accent'>>();
    // Axes the base did not declare resolve to the defaults through the base.
    expectTypeOf(child.vocabulary.size).toEqualTypeOf<DefaultSize>();
    expectTypeOf(child.vocabulary.variant).toEqualTypeOf<DefaultVariant>();
  });

  it('axes the child declares win over the base at the type level', () => {
    const base = createTheme({
      tokens: fullTokens,
      vocabulary: { intent: defineVocabulary(['brand']) },
    });
    const child = createTheme({
      extends: base,
      tokens: fullTokens,
      vocabulary: { intent: defineVocabulary(['safe', 'critical']) },
    });

    expectTypeOf(child.vocabulary.intent).toEqualTypeOf<Vocabulary<'safe' | 'critical'>>();
  });

  it('a base typed as wide ResolvedTheme yields honestly wide axes', () => {
    const base = createTheme({
      tokens: fullTokens,
      vocabulary: { intent: defineVocabulary(['brand']) },
    });
    // Simulates a base threaded through a ResolvedTheme-typed reference.
    const widened: import('../src/types.ts').ResolvedTheme = base;
    const child = createTheme({ extends: widened, tokens: fullTokens });

    expectTypeOf(child.vocabulary.intent).toEqualTypeOf<Vocabulary<string>>();
  });

  it('without extends, omitted axes still resolve to the default vocabularies', () => {
    const theme = createTheme({ tokens: fullTokens });

    expectTypeOf(theme.vocabulary.size).toEqualTypeOf<DefaultSize>();
    expectTypeOf(theme.vocabulary.variant).toEqualTypeOf<DefaultVariant>();
  });
});

describe('createTheme tokens optionality', () => {
  it('accepts omitted or partial tokens when extends is present', () => {
    const base = createTheme({ tokens: fullTokens });

    const noTokens = createTheme({ extends: base });
    const partialTokens = createTheme({
      extends: base,
      tokens: { radius: { md: '1rem' } },
    });

    expectTypeOf(noTokens.tokens.radius).toEqualTypeOf<Record<string, string>>();
    expectTypeOf(partialTokens.tokens.radius).toEqualTypeOf<Record<string, string>>();
  });

  it('requires full tokens when extends is absent', () => {
    // @ts-expect-error tokens is required without extends
    createTheme({ name: 'no-tokens' });

    // @ts-expect-error radius/spacing/fontSize are required without extends
    createTheme({ tokens: { colors: {} } });
  });
});
