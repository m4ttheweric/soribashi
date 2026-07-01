import type { ResolvedTheme } from '@soribashi/theme';
import { useTheme } from '../provider/use-theme.ts';

/**
 * Merges three sources of props in this precedence (highest to lowest):
 *
 *   1. Instance props
 *   2. Theme component defaultProps (object OR `(theme) => Partial<Props>` callback)
 *   3. Component-level defaults
 *
 * Instance props with explicit `undefined` do NOT override defaults.
 *
 * Reference: validated against Mantine's useProps at
 * `packages/@mantine/core/src/core/MantineProvider/use-props/use-props.ts`
 * (master @ 63dafbbf, 2026-04-25). Soribashi matches Mantine's resolution
 * order and supports the function-form defaultProps Mantine added for
 * theme-driven dynamic defaults.
 */
export function useProps<P>(name: string, defaults: Partial<P> | null, instanceProps: P): P {
  const theme = useTheme();
  const themeDefaultsRaw = theme.components[name]?.defaultProps;
  const themeDefaults = (
    typeof themeDefaultsRaw === 'function'
      ? (themeDefaultsRaw as (t: ResolvedTheme) => Partial<P>)(theme)
      : (themeDefaultsRaw ?? {})
  ) as Partial<P>;

  const merged: Record<string, unknown> = {
    ...((defaults as Record<string, unknown> | null) ?? {}),
    ...(themeDefaults as Record<string, unknown>),
  };

  const instance = instanceProps as Record<string, unknown>;
  for (const key in instance) {
    if (instance[key] !== undefined) {
      merged[key] = instance[key];
    }
  }

  return merged as P;
}
