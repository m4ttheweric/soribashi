import type { ThemeComponentEntry } from './theme-component-entry.ts';

// Re-export so consumers can import ThemeComponentEntry from '@soribashi/theme'
export type { ThemeComponentEntry } from './theme-component-entry.ts';

// Token-level types

/**
 * A color scale is an object keyed by shade name (`50`, `100`, `500`, `950`, etc.)
 * mapping to CSS color values. Unlike Mantine, soribashi does NOT enforce a fixed
 * 10-element tuple; teams may use any keys including `0`, `25`, `950`, `foreground`, etc.
 *
 * Reference: this addresses a Mantine workaround documented in
 * console-archive/packages/ui/design-system/colors.ts where the team had to
 * truncate 12-shade palettes to fit Mantine's MantineColorsTuple constraint.
 */
export type ColorScale = Record<string, string>;

/**
 * The full set of theme tokens. Codegen reads this to emit CSS variables.
 */
export interface ThemeTokens {
  colors: Record<string, ColorScale>;
  radius: Record<string, string>;
  spacing: Record<string, string>;
  fontSize: Record<string, string>;
  fontFamily?: Record<string, string>;
  fontWeight?: Record<string, string>;
  lineHeight?: Record<string, string>;
  shadow?: Record<string, string>;
  breakpoint?: Record<string, string>;
  zIndex?: Record<string, string | number>;
  /** Heading sizes per order (h1-h6). Used by the Title block. */
  heading?: HeadingTokens;
}

export interface HeadingSize {
  fontSize: string;
  fontWeight?: string;
  lineHeight?: string;
}

export interface HeadingTokens {
  sizes: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', HeadingSize>;
  textWrap?: string;
}

/**
 * Partial tokens for dark-mode overrides. Any token omitted falls back to its
 * light-mode value.
 */
export type PartialThemeTokens = {
  colors?: Record<string, Partial<ColorScale>>;
  radius?: Partial<Record<string, string>>;
  spacing?: Partial<Record<string, string>>;
  fontSize?: Partial<Record<string, string>>;
  fontFamily?: Partial<Record<string, string>>;
  fontWeight?: Partial<Record<string, string>>;
  lineHeight?: Partial<Record<string, string>>;
  shadow?: Partial<Record<string, string>>;
  breakpoint?: Partial<Record<string, string>>;
  zIndex?: Partial<Record<string, string | number>>;
  heading?: Partial<HeadingTokens>;
};

// Semantic-level types

/**
 * A semantic alias maps a logical name (e.g. `text.muted`) to a token reference
 * (e.g. `colors.neutral.500`). The reference is a dot-path string into `tokens`.
 */
export type SemanticReference = string;

/**
 * A surface slot may be a plain token reference (string) or an object that
 * pairs the surface background with an optional formalized foreground.
 *
 * Object form was introduced in Wave 2 for the Tooltip `floating` slot, which
 * needs to declare its paired foreground color in the token vocabulary.
 * Existing string-form surface values continue to work unchanged.
 */
export type SemanticSurfaceValue =
  | SemanticReference
  | { value: SemanticReference; foreground?: SemanticReference };

export interface SemanticTokens {
  /** Available intent values; constrains components' `intent` prop */
  intent: readonly string[];
  /** Available variant values; constrains components' `variant` prop */
  variant: readonly string[];
  text: Record<string, SemanticReference>;
  /**
   * Layered surface elevation. Each slot is either a plain token reference
   * (string) or an object `{ value, foreground? }` for surfaces that declare
   * a paired foreground. Suggested layers: canvas, default, raised, sunken,
   * overlay. `floating` was added in Wave 2 for the Tooltip pilot.
   */
  surface: Record<string, SemanticSurfaceValue>;
  border: Record<string, SemanticReference>;
  /**
   * Optional accent slot for semantic colors that don't fit `text`/`surface`/`border` —
   * e.g. `accent.feedback` for inline highlight rings, `accent.brand` for non-chrome
   * brand emphasis. Symmetrical with the other slots: each entry maps a logical name
   * to a token reference (e.g. `colors.primary.500`). Codegen emits `--accent-{key}`
   * CSS vars when this slot is present.
   *
   * Wave 1 didn't need this; reserved for the CVI integration project's `accent.feedback`
   * token. See conversion journal § 4 Gap 4.
   */
  accent?: Record<string, SemanticReference>;
}

// Intent resolver types

export interface IntentResolverInput {
  intent: string;
  variant: string;
  theme: ResolvedTheme;
}

export interface IntentResolverResult {
  background: string;
  color: string;
  border: string;
  hover?: string;
  active?: string;
  hoverColor?: string;
}

export type IntentResolver = (input: IntentResolverInput) => IntentResolverResult;

// Component theme override types

export interface ComponentThemeConfig {
  defaultProps?: Record<string, unknown>;
  classNames?:
    | Record<string, string>
    | ((theme: ResolvedTheme, props: Record<string, unknown>) => Record<string, string>);
  styles?:
    | Record<string, Record<string, string | number>>
    | ((
        theme: ResolvedTheme,
        props: Record<string, unknown>,
      ) => Record<string, Record<string, string | number>>);
  vars?: (theme: ResolvedTheme, props: Record<string, unknown>) => Record<string, Record<string, string>>;
  attributes?: Record<string, Record<string, unknown>>;
}

// Top-level theme types

export interface ThemeDefinition {
  tokens: ThemeTokens;
  dark?: PartialThemeTokens;
  semantic?: Partial<SemanticTokens>;
  intentResolver?: IntentResolver;
  components?: Record<string, ComponentThemeConfig> | readonly ThemeComponentEntry[];
  /** CSS selector for light scope. Defaults to `:root`. */
  scope?: string;
  /** CSS selector(s) for dark mode. Defaults to `.dark`. */
  darkMode?: { selector: string };
  /** Theme to extend; this theme's fields override base. */
  extends?: ThemeDefinition;
  /** Display name for debugging */
  name?: string;
}

/**
 * The fully-resolved, normalized theme.
 */
export interface ResolvedTheme {
  tokens: ThemeTokens;
  dark: PartialThemeTokens;
  semantic: SemanticTokens;
  intentResolver: IntentResolver;
  components: Record<string, ComponentThemeConfig>;
  scope: string;
  darkMode: { selector: string };
  name: string;
}
