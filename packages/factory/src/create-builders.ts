import type { ResolvedTheme } from '@soribashi/theme';
import { defineComponent } from './define-component.tsx';
import { definePolymorphicComponent } from './define-polymorphic-component.tsx';
import { defineCompound } from './define-compound.tsx';
import { defineGenericComponent } from './define-generic-component.tsx';
import { registerComponentVocabularies } from './vocabulary-registry.ts';

/**
 * Builder factory — the consumer's entry point for vocab-aware builders.
 *
 * Registers the theme's global vocabulary + per-component vocabulary overrides
 * with the runtime registry, then returns the standard four builders. The
 * builders are the SAME implementation regardless — vocab validation is keyed
 * off the registry rather than per-builder configuration.
 *
 * Consumers wire this once in their app:
 *
 *   // apps/my-app/src/builders.ts
 *   import { createSoribashiBuilders } from '@soribashi/core';
 *   import { theme } from './theme';
 *   export const { defineComponent, definePolymorphicComponent, defineCompound } =
 *     createSoribashiBuilders(theme);
 *
 * Then recipes import from '../builders' instead of '@soribashi/core' directly.
 */
export function createSoribashiBuilders<TTheme extends ResolvedTheme>(theme: TTheme) {
  // Register the global vocabulary under __global__
  registerComponentVocabularies('__global__', {
    size: theme.vocabulary.size,
    intent: theme.vocabulary.intent,
    variant: theme.vocabulary.variant,
  });

  // Register per-component vocabularies from theme.components.
  // After Task 15's normalizeComponents, function-form overrides are already
  // resolved to concrete Vocabulary values; theme.components is a Record<string, ComponentThemeConfig>.
  for (const [name, config] of Object.entries(theme.components)) {
    const componentVocab = (config as { vocabulary?: { size?: any; intent?: any; variant?: any } }).vocabulary;
    if (componentVocab) {
      registerComponentVocabularies(name, {
        ...(componentVocab.size !== undefined && { size: componentVocab.size }),
        ...(componentVocab.intent !== undefined && { intent: componentVocab.intent }),
        ...(componentVocab.variant !== undefined && { variant: componentVocab.variant }),
      });
    }
  }

  return {
    defineComponent,
    definePolymorphicComponent,
    defineCompound,
    defineGenericComponent,
  };
}
