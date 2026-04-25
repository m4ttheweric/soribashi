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

export interface SemanticTokens {
  /** Available intent values; constrains components' `intent` prop */
  intent: readonly string[];
  /** Available variant values; constrains components' `variant` prop */
  variant: readonly string[];
  text: Record<string, SemanticReference>;
  /** Layered surface elevation. Suggested layers: canvas, default, raised, sunken, overlay. */
  surface: Record<string, SemanticReference>;
  border: Record<string, SemanticReference>;
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
  components?: Record<string, ComponentThemeConfig>;
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
