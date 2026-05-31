/**
 * Local builder entry point for the pilot.
 *
 * `createSoribashiBuilders(theme)` registers the theme's global vocabulary and
 * every per-component override (theme.components) with the runtime registry,
 * then returns the four builders. Recipes import from here instead of
 * '@soribashi/core' so that (a) the registry is populated before any recipe
 * renders, and (b) PR #12 can swap these for theme-typed builders without
 * touching recipe import sites.
 */
import { createSoribashiBuilders } from '@soribashi/core';
import { theme } from './theme/index.ts';

export const {
  defineComponent,
  definePolymorphicComponent,
  defineCompound,
  defineGenericComponent,
} = createSoribashiBuilders(theme);
