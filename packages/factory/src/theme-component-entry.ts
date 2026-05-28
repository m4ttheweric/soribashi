/**
 * Tagged record returned by `Component.extend({...})`. Consumers pass
 * an array of these to `createTheme({ components: [...] })`. The factory's
 * normalization step (in @soribashi/theme's createTheme) builds the legacy
 * `Record<string, ComponentThemeConfig>` shape from these entries internally.
 *
 * The `__soribashiThemeEntry` brand prevents accidental confusion with
 * adjacent record-form values.
 *
 * NOTE: The canonical definition lives in `@soribashi/theme` (types.ts) to
 * avoid a circular package dependency (factory → theme already exists).
 * This file re-exports from there.
 */
export type { ThemeComponentEntry } from '@soribashi/theme';
export { isThemeComponentEntry } from '@soribashi/theme';
