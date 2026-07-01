import type { ResolvedTheme } from '@soribashi/theme';

export interface CodegenOutput {
  /** Path (relative to project root) where theme.css will be written */
  css: string;
  /** Optional Tailwind output config */
  tailwind?: TailwindOutput;
}

export type TailwindOutput =
  | { mode: 'v3'; configPath: string }
  | { mode: 'v4'; themeCssPath: string }
  | { mode: 'both'; configPath: string; themeCssPath: string };

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
   * Whether to emit `--__hsl-color-*` companion variables alongside the canonical
   * wrapped color vars. The companions hold bare HSL components (`221.2 83.2% 53.3%`
   * instead of `hsl(221.2 83.2% 53.3%)`) so that:
   *   - Tailwind v3's `<alpha-value>` substitution can splice in alpha:
   *     `hsl(var(--__hsl-color-primary-500) / <alpha-value>)`
   *   - Hand-written CSS can use alpha directly:
   *     `background: hsl(var(--__hsl-color-primary-500) / 0.4);`
   *
   * The `--__hsl-` prefix (rather than a `-hsl` suffix) keeps the companion vars
   * out of the `--color-` autocomplete namespace — typing `--color-` only surfaces
   * canonical wrapped vars; typing `--__hsl` deliberately reaches the private
   * companion namespace.
   *
   * Modes:
   *   - 'auto'  (default): emit companions only when the codegen config's Tailwind
   *             output is missing OR is mode='v3'/mode='both' (i.e., when the
   *             companions can be referenced from generated Tailwind config or
   *             from hand-written CSS that pairs with v3 emission). Skip
   *             companions in mode='v4'-only setups, where Tailwind v4's
   *             `color-mix()` runtime makes them unnecessary.
   *   - true   : always emit companions.
   *   - false  : never emit companions.
   *
   * Driven from `build.ts` based on the resolved Tailwind output mode; consumers
   * setting this directly can override the auto-detection.
   *
   * @default 'auto'
   */
  emitCompanionHsl?: 'auto' | boolean;
}
