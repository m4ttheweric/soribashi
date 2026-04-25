import { useTheme } from '../provider/use-theme.ts';

/**
 * Merges three sources of props in this precedence (highest to lowest):
 *
 *   1. Instance props
 *   2. Theme component defaultProps
 *   3. Component-level defaults
 *
 * Instance props with explicit `undefined` do NOT override defaults.
 */
export function useProps<P extends Record<string, unknown>>(
  name: string,
  defaults: Partial<P> | null,
  instanceProps: P,
): P {
  const theme = useTheme();
  const themeDefaults = (theme.components[name]?.defaultProps ?? {}) as Partial<P>;

  const merged: Partial<P> = {
    ...(defaults ?? {}),
    ...themeDefaults,
  };

  for (const key in instanceProps) {
    if (instanceProps[key] !== undefined) {
      (merged as Record<string, unknown>)[key] = instanceProps[key];
    }
  }

  return merged as P;
}
