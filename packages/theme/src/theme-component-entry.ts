import type { VocabularyOverride } from './vocabulary-override.ts';

/**
 * Tagged record returned by `Component.extend({...})`. Consumers pass
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
  /** Per-component vocabulary overrides — function-form values resolved at createTheme() time. */
  readonly vocabulary?: {
    size?: VocabularyOverride;
    intent?: VocabularyOverride;
    variant?: VocabularyOverride;
  };
  readonly classNames?: unknown;
  readonly styles?: unknown;
  readonly vars?: unknown;
  readonly attributes?: unknown;
}

/** Returns true only for plain objects (prototype is Object.prototype or null). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Type guard for runtime detection. */
export function isThemeComponentEntry(value: unknown): value is ThemeComponentEntry {
  if (!isPlainObject(value)) return false;
  const v = value as Partial<ThemeComponentEntry> & { __soribashiThemeEntry?: unknown };
  return (
    v.__soribashiThemeEntry === true && typeof v.name === 'string' && isPlainObject(v.defaultProps)
  );
}
