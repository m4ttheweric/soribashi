import type { ResolvedTheme } from '@soribashi/theme';
import type { SpacingUtilitiesMode } from './emit-tailwind-v4.ts';

export interface CodegenOutput {
  /** Path (relative to project root) where theme.css will be written */
  css: string;
  /** Optional Tailwind output config */
  tailwind?: TailwindOutput;
}

export type TailwindOutput = {
  mode: 'v4';
  themeCssPath: string;
  spacingUtilities?: SpacingUtilitiesMode;
};

export interface CodegenConfig {
  theme: ResolvedTheme;
  output: CodegenOutput;
  /** Glob patterns to watch in dev mode */
  watch?: string[];
  /** Optional codegen knobs passed to emitCss. */
  emit?: EmitCssOptions;
}

/**
 * Additional CSS variables to inject into the emit output.
 *
 *   root  — vars added inside the `:root { ... }` block
 *   dark  — vars added inside the `.dark { ... }` block
 *   scopes — per-scope additions (when consumer themes use scope codegen)
 */
export interface CssVariablesAddition {
  root?: Record<string, string>;
  dark?: Record<string, string>;
  scopes?: Record<string, { root?: Record<string, string>; dark?: Record<string, string> }>;
}

/**
 * Consumer-pluggable hook for injecting additional CSS variables at codegen time.
 * Runs once per `emitCss()` invocation. Output is appended to the corresponding
 * blocks; on key conflict, consumer-emitted vars override defaults via the CSS
 * cascade (they emit later within the same selector block).
 *
 * Differs from Mantine's `cssVariablesResolver` (which runs at render time and
 * receives a color-scheme argument). Soribashi's runs at build time and emits
 * both `:root` and `.dark` blocks together; consumers handle scheme via the
 * separate fields.
 */
export type CssVariablesResolver = (theme: ResolvedTheme) => CssVariablesAddition;

/**
 * Options for `emitCss(theme, opts)`. All fields are optional.
 */
export interface EmitCssOptions {
  /**
   * If true, removes token entries that exactly match the soribashi default theme
   * before emitting. Reduces CSS payload for themes that mostly inherit from defaults.
   *
   * CONSTRAINT: the deduped output is not self-contained. Soribashi does not ship
   * a baseline stylesheet (no equivalent of @mantine/core/styles.css), so anything
   * this option removes must be defined by a consumer-provided baseline stylesheet
   * loaded before the generated CSS; otherwise the removed variables are undefined
   * at runtime. emitCss warns at build time whenever the option removes anything.
   * @default false
   */
  removeDefaultVariables?: boolean;

  /**
   * Optional consumer-pluggable resolver. Called once per emit; output is appended
   * to `:root`, `.dark`, and (optionally) per-scope blocks.
   */
  cssVariablesResolver?: CssVariablesResolver;

  /**
   * If false, omits the `soribashi.utilities` layer (the visibility utility
   * classes: `.sb-hidden-from-*`, `.sb-visible-from-*`, `.sb-light-hidden`,
   * `.sb-dark-hidden`). These are global, breakpoint-and-darkMode-driven
   * rules, not per-tenant token values, so a scoped/tenant emission that
   * already gets them from the root theme.css should pass `false` here
   * rather than restating identical rules per scope.
   * @default true
   */
  utilities?: boolean;
}
