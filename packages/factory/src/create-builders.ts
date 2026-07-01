import type { ComponentThemeConfig, ResolvedTheme } from '@soribashi/theme';
import { defineComponent } from './define-component.tsx';
import { definePolymorphicComponent } from './define-polymorphic-component.tsx';
import { defineCompound } from './define-compound.tsx';
import { defineGenericComponent } from './define-generic-component.tsx';
import { registerComponentVocabularies, resetRegistry } from './vocabulary-registry.ts';
import type {
  ThemedDefineComponent,
  ThemedDefinePolymorphicComponent,
  ThemedDefineCompound,
  ThemedDefineGenericComponent,
} from './types/themed-builders.ts';

/**
 * Registers a theme's global + per-component vocabularies with the runtime
 * registry, so the dev-only Zod validation can resolve each axis. This is the
 * side-effecting half of builder setup, separated from `makeBuilders` so a
 * consumer can break the `theme → recipe → builders → theme` import cycle:
 * `builders.ts` calls `makeBuilders<typeof theme>()` (type-only theme import,
 * no runtime edge), and the app entry calls `registerTheme(theme)` once.
 *
 *   // apps/my-app/src/main.tsx
 *   import { theme } from './theme';
 *   registerTheme(theme);
 *
 * **Idempotency.** Resets the registry before re-registering, so the registry
 * always reflects exactly the provided theme — stale registrations from a prior
 * call (HMR, tests, multi-init) don't survive. Single-tenant per spec §14 risk 5.
 */
export function registerTheme<TTheme extends ResolvedTheme>(theme: TTheme): void {
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
}

/**
 * Returns the four vocab-aware builders, typed against the theme `TTheme`
 * supplied as a TYPE argument (no theme value needed). The builder
 * implementations are theme-independent — `TTheme` only refines the declared
 * types so a recipe's PUBLIC props (and `defaults`) narrow to the theme's
 * global-axis literals (size/intent). `variant` stays recipe-local, narrowed
 * by the recipe's own variants tuple.
 *
 * Because no theme VALUE is imported, `builders.ts` can do:
 *
 *   import type { theme } from './theme';   // erased — no runtime cycle
 *   export const { definePolymorphicComponent } = makeBuilders<typeof theme>();
 *
 * which lets the theme freely import recipes and use `Recipe.extend(...)` in
 * its `components` array. Pair with a one-time `registerTheme(theme)` at app entry.
 */
export function makeBuilders<TTheme extends ResolvedTheme>() {
  return {
    defineComponent: defineComponent as ThemedDefineComponent<TTheme['vocabulary']>,
    definePolymorphicComponent: definePolymorphicComponent as ThemedDefinePolymorphicComponent<
      TTheme['vocabulary']
    >,
    defineCompound: defineCompound as ThemedDefineCompound<TTheme['vocabulary']>,
    defineGenericComponent: defineGenericComponent as ThemedDefineGenericComponent<
      TTheme['vocabulary']
    >,
  };
}

/**
 * Convenience: `registerTheme(theme)` + `makeBuilders<TTheme>()` in one call,
 * for consumers whose `builders.ts` can import the theme value without forming a
 * cycle (e.g. the theme declares no per-component `Recipe.extend(...)` entries,
 * or single-file setups). Where the theme uses `Recipe.extend(...)`, prefer the
 * `makeBuilders` + `registerTheme` split to avoid the import cycle.
 */
export function createSoribashiBuilders<TTheme extends ResolvedTheme>(theme: TTheme) {
  registerTheme(theme);
  return makeBuilders<TTheme>();
}
