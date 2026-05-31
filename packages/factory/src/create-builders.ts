import type { ComponentThemeConfig, ResolvedTheme } from '@soribashi/theme';
import { defineComponent } from './define-component.tsx';
import { definePolymorphicComponent } from './define-polymorphic-component.tsx';
import { defineCompound } from './define-compound.tsx';
import { defineGenericComponent } from './define-generic-component.tsx';
import { registerComponentVocabularies, resetRegistry } from './vocabulary-registry.ts';
import type { ThemedDefinePolymorphicComponent } from './types/themed-builders.ts';

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
 *
 * **Idempotency.** Each call resets the registry before re-registering, so
 * the registry always reflects exactly the provided theme. This matters for
 * HMR and test scenarios where `createSoribashiBuilders` is invoked multiple
 * times: stale component registrations from a previous invocation don't
 * silently survive into the new theme's view.
 */
export function createSoribashiBuilders<TTheme extends ResolvedTheme>(theme: TTheme) {
  // Idempotent reset — prior registrations from earlier createSoribashiBuilders
  // calls (HMR, tests, re-init) are cleared so the registry reflects the new
  // theme exactly. Single-tenant assumption per spec § 14 risk 5.
  resetRegistry();

  // Register the global vocabulary under __global__
  registerComponentVocabularies('__global__', {
    size: theme.vocabulary.size,
    intent: theme.vocabulary.intent,
    variant: theme.vocabulary.variant,
  });

  // Register per-component vocabularies from theme.components.
  // After normalizeComponents, function-form overrides are already resolved to
  // concrete Vocabulary values; theme.components is a Record<string, ComponentThemeConfig>.
  for (const [name, config] of Object.entries(theme.components) as Array<[string, ComponentThemeConfig]>) {
    const componentVocab = config.vocabulary;
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
    // Theme-narrowed view: the produced component's PUBLIC props carry the
    // theme's literal unions for the global axes (size/intent). Runtime is the
    // same function — the cast only refines the declared type. `variant` stays
    // recipe-local. defineComponent/defineCompound/defineGenericComponent are
    // returned raw because the pilot's only global-axis consumer is the
    // polymorphic Button; extending the same pattern to them is mechanical when
    // a global-axis consumer appears.
    definePolymorphicComponent: definePolymorphicComponent as ThemedDefinePolymorphicComponent<
      TTheme['vocabulary']
    >,
    defineCompound,
    defineGenericComponent,
  };
}
