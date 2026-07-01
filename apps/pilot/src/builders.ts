/**
 * Local builder entry point for the pilot.
 *
 * `makeBuilders<typeof theme>()` returns the four builders typed against the
 * theme's vocabulary — so `definePolymorphicComponent` produces components whose
 * public props narrow `size`/`intent` to the theme's literal unions. The theme
 * is imported as a TYPE only: this is what breaks the otherwise-fatal cycle
 * (`theme → recipe → builders → theme`). Because no theme VALUE is imported here,
 * `theme/index.ts` is free to import the recipes and use `Recipe.extend(...)` in
 * its `components` array. The runtime registry is populated once by the
 * `registerTheme(theme)` call in `theme/index.ts`.
 */
import type { BaseTheme } from './theme/index.ts';
import { makeBuilders } from '@soribashi/core';

export const {
  defineComponent,
  definePolymorphicComponent,
  defineCompound,
  defineGenericComponent,
} = makeBuilders<BaseTheme>();
