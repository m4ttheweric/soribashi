import type { ComponentThemeConfig, ThemeDefinition } from './types.ts';
import { isThemeComponentEntry } from './theme-component-entry.ts';

/**
 * Safely converts an unknown value to a string for error messages.
 * JSON.stringify throws on circular references, BigInt, etc.; this wrapper
 * falls back gracefully instead of obscuring the original error.
 */
function describe(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

/**
 * Normalizes `ThemeDefinition['components']` (either an array of
 * `ThemeComponentEntry` objects or an already-normalized record) into the
 * internal `Record<string, ComponentThemeConfig>` shape.
 *
 * When an array is provided, each element is validated at runtime — a clear
 * error is thrown if a caller accidentally passes a plain object instead of
 * using `Component.extend({...})`.
 */
export function normalizeComponents(
  input: ThemeDefinition['components'] | undefined,
): Record<string, ComponentThemeConfig> {
  if (input === undefined) return {};
  if (Array.isArray(input)) {
    const out: Record<string, ComponentThemeConfig> = {};
    for (const entry of input) {
      if (!isThemeComponentEntry(entry)) {
        throw new Error(
          `createTheme: components array contains a non-ThemeComponentEntry value. ` +
          `Use Component.extend({...}) to construct entries; got: ${describe(entry)}`,
        );
      }
      // Last-write-wins: later entries override earlier ones with the same name.
      out[entry.name] = { defaultProps: entry.defaultProps };
    }
    return out;
  }
  return input as Record<string, ComponentThemeConfig>;
}
