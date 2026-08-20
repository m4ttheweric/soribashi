import type { ResolvedTheme } from '@soribashi/theme';
import { isDev } from './style-props/theme-resolvers/is-dev.ts';

/**
 * Dedupes the SORI-20 missing-default warning below so a component that
 * re-renders (or renders many instances) without a fix only logs once per
 * component+missing-default combination, not once per render. Follows the
 * same is-dev-gated, Set-deduped pattern as parse-style-props.ts's
 * `warnedMissingBreakpoints`.
 */
const warnedMissingDefault = new Set<string>();

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
  if (!intent || !variant) {
    // Behaviour is deliberately unchanged here (SORI-20 is decision-gated,
    // not a behaviour fix): autoVars still silently no-ops unless BOTH
    // intent and variant are set. This only adds a dev-only, deduped
    // diagnostic naming which default is missing, so the silent no-op stops
    // being silent to whoever's debugging it. If this ever fires during
    // soribashi's own test suite, that is real signal that the firing
    // component is missing a default for intent/variant -- report it
    // rather than suppressing the warning.
    if (isDev()) {
      const missing = [!intent && 'intent', !variant && 'variant'].filter(Boolean).join(' and ');
      const key = `${componentName}:${missing}`;
      if (!warnedMissingDefault.has(key)) {
        warnedMissingDefault.add(key);
        // eslint-disable-next-line no-console
        console.warn(
          `[soribashi] ${componentName} declares variants but has no "${missing}" default set ` +
            '(via defaultProps or an explicit prop), so autoVars is returning {} instead of deriving ' +
            `--${componentName.toLowerCase()}-bg/-color/-border. Both intent and variant must be set ` +
            'for autoVars to run.',
        );
      }
    }
    return {};
  }

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
