import type { ResolvedTheme } from '@soribashi/theme';

/**
 * Auto-derives root-selector CSS variables from the theme's intent resolver
 * for components that declare variants. Returns {} if not applicable.
 *
 * Naming: `--{lowercased-component-name}-{key}` where key = `bg | color | border | hover | active | hover-color`.
 */
export function autoVars(
  theme: ResolvedTheme,
  componentName: string,
  props: Record<string, unknown>,
  hasVariants: boolean,
): { root?: Record<string, string> } {
  if (!hasVariants) return {};

  const intent = props.intent as string | undefined;
  const variant = props.variant as string | undefined;
  if (!intent || !variant) return {};

  const result = theme.intentResolver({ intent, variant, theme });
  const prefix = componentName.toLowerCase();

  const root: Record<string, string> = {
    [`--${prefix}-bg`]: result.background,
    [`--${prefix}-color`]: result.color,
    [`--${prefix}-border`]: result.border,
  };

  if (result.hover !== undefined) root[`--${prefix}-hover`] = result.hover;
  if (result.active !== undefined) root[`--${prefix}-active`] = result.active;
  if (result.hoverColor !== undefined) root[`--${prefix}-hover-color`] = result.hoverColor;

  return { root };
}
