/**
 * Tagged record returned by `Component.withDefaults({...})`. Consumers pass
 * an array of these to `createTheme({ components: [...] })`. The factory's
 * normalization step (in @soribashi/theme's createTheme) builds the legacy
 * `Record<string, ComponentThemeConfig>` shape from these entries internally.
 *
 * The `__soribashiThemeEntry` brand prevents accidental confusion with
 * adjacent record-form values.
 *
 * This type lives in @soribashi/theme (not @soribashi/factory) because
 * @soribashi/theme's ThemeDefinition references it, and factory already
 * depends on theme — putting it here avoids a circular package dependency.
 */
export interface ThemeComponentEntry<P = Record<string, unknown>> {
  readonly __soribashiThemeEntry: true;
  readonly name: string;
  readonly defaultProps: Partial<P>;
}

/** Type guard for runtime detection. */
export function isThemeComponentEntry(value: unknown): value is ThemeComponentEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ThemeComponentEntry> & { __soribashiThemeEntry?: unknown };
  return (
    v.__soribashiThemeEntry === true &&
    typeof v.name === 'string' &&
    typeof v.defaultProps === 'object' &&
    v.defaultProps !== null &&
    !Array.isArray(v.defaultProps)
  );
}
