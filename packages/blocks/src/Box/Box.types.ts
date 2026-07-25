/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/Box.types.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 */
import type { BoxStyleProps } from '@soribashi/factory';
import type { BoxMod } from './get-box-mod.ts';

export type { BoxMod, BoxStyleProps };

/**
 * The full Box prop surface — style props + the `mod` API.
 */
export interface BoxOwnProps extends BoxStyleProps {
  /** Modifier API: `mod="active"`, `mod={{ active: true }}`, `mod={[...]}` */
  mod?: BoxMod;
  /** Variant string passed through as `data-variant` */
  variant?: string;

  // Visibility props — consumed by Box (never forwarded to the DOM)

  /** Breakpoint above which the component is hidden with `display: none` */
  hiddenFrom?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Breakpoint below which the component is hidden with `display: none` */
  visibleFrom?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Hide the component in light color scheme */
  lightHidden?: boolean;
  /** Hide the component in dark color scheme */
  darkHidden?: boolean;
  /**
   * NOT applied — soribashi has no CSS-in-JS runtime. The value is consumed
   * (so it cannot leak to the DOM) and a dev-only warning is emitted when set.
   * Use `style`, style props, or the Styles API instead.
   */
  sx?: Record<string, unknown>;
}
