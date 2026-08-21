import type { DefaultVocabularies } from './default-vocabularies.ts';
import type { Vocabulary } from './define-vocabulary.ts';
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
  /**
   * Transition and animation durations. Split from `motionEase` rather than
   * nested under one `motion` object so both follow the same flat
   * `Record<string, string>` shape every other family here uses, and so a
   * theme can override one without restating the other.
   */
  motionDuration?: Record<string, string>;
  /** Easing curves, named by intent (enter/exit/standard) rather than by curve. */
  motionEase?: Record<string, string>;
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

// Vocabulary types

/**
 * Per-axis vocabulary definitions. Each axis is optional in the input;
 * createTheme() fills missing axes from DEFAULT_VOCABULARIES.
 */
export interface ThemeVocabulary {
  size: Vocabulary;
  intent: Vocabulary;
  variant: Vocabulary;
}

export type PartialThemeVocabulary = {
  size?: Vocabulary;
  intent?: Vocabulary;
  variant?: Vocabulary;
};

/**
 * Resolves a (partial) declared vocabulary to a full `ThemeVocabulary` at the
 * TYPE level, mirroring what `createTheme()` does at runtime: each omitted axis
 * falls back to `Base` (the default vocabularies for fresh themes, the base
 * theme's vocabulary when extending). Crucially, declared axes keep their
 * literal unions (e.g. `Vocabulary<'xs' | 'sm' | 'md' | 'lg' | 'xl'>`) instead
 * of widening to `Vocabulary<string>`, so `ResolvedTheme<ResolveVocab<V>>`
 * carries the consumer's exact vocab literals for downstream type threading.
 *
 * The `infer X extends Vocabulary` form handles both an absent key and an
 * explicit `undefined` cleanly, falling back to `Base` in either case.
 */
export type ResolveVocab<
  V extends PartialThemeVocabulary,
  Base extends ThemeVocabulary = DefaultVocabularies,
> = {
  size: V extends { size: infer S extends Vocabulary } ? S : Base['size'];
  intent: V extends { intent: infer I extends Vocabulary } ? I : Base['intent'];
  variant: V extends { variant: infer Va extends Vocabulary } ? Va : Base['variant'];
};

// Semantic-level types

/**
 * A semantic alias maps a logical name (e.g. `text.muted`) to a token reference
 * (e.g. `colors.neutral.500`). The reference is a dot-path string into `tokens`.
 */
export type SemanticReference = string;

/**
 * A surface slot may be a plain token reference (string) or an object that
 * pairs the surface background with an optional formalized foreground and/or
 * an optional per-scheme override.
 *
 * Object form was introduced in Wave 2 for the Tooltip `floating` slot, which
 * needs to declare its paired foreground color in the token vocabulary.
 * Existing string-form surface values continue to work unchanged.
 *
 * `dark`, added in the design-ledger slice, is a SECOND reference, not a
 * literal colour: codegen resolves both `value` and `dark` to their own
 * `var(--color-...)` lookups and pairs the two through the same
 * `light-dark()` mechanism `tokens.colors`' own dark overrides already use
 * (see emit-css.ts's `pairValue`), emitting ONE custom property whose two
 * branches can point at entirely different ramp positions instead of the
 * same reference's own light/dark pair. This exists because a fixed
 * rung-count gap in a colour ramp is not scheme-symmetric under WCAG
 * relative luminance (the dark tail of a ramp compresses harder than the
 * light head for the same gap). A recipe that needs "clearly distinct from
 * canvas" in both schemes may need different ramp indices per scheme, and
 * previously had no theme-only way to say so short of a recipe-authored
 * `.dark`-scoped CSS override, which broke "re-skinnable through createTheme
 * plus .extend() alone, with no file edits" the moment a consumer wanted a
 * different value. `dark` absent (the default): `value` resolves identically
 * in both schemes, exactly as before this field existed.
 */
export type SemanticSurfaceValue =
  | SemanticReference
  | { value: SemanticReference; dark?: SemanticReference; foreground?: SemanticReference };

/**
 * Role-name aliases. Emitted as CSS custom properties at codegen time.
 * Structurally identical to the old `semantic.text/surface/border/accent`.
 */
export interface SemanticTokensConfig {
  text: Record<string, SemanticReference>;
  surface: Record<string, SemanticSurfaceValue>;
  border: Record<string, SemanticReference>;
  accent?: Record<string, SemanticReference>;
  /**
   * Present (as `false`) only on a theme that opted out of createTheme's
   * default backfill. Recorded on the resolved theme so the opt-out survives
   * re-resolution: `createTheme({ extends: alreadyResolvedTheme })` feeds the
   * resolved object back through the resolver, which would otherwise backfill
   * the very slots the base declined. Absent means "backfilled normally",
   * which is every theme that predates the flag.
   */
  defaults?: false;
}

export type PartialSemanticTokensConfig = {
  text?: Record<string, SemanticReference>;
  surface?: Record<string, SemanticSurfaceValue>;
  border?: Record<string, SemanticReference>;
  accent?: Record<string, SemanticReference>;
  /**
   * Whether `createTheme` backfills the text/surface/border slots this theme
   * did not declare (`DEFAULT_SEMANTIC_TOKENS`). Defaults to `true`.
   *
   * Those defaults reference the `neutral` colour family, so a palette built
   * from scratch with no `neutral` ramp fails validation on slots it never
   * wrote. Set `false` to take full ownership of the semantic layer: nothing
   * is backfilled, and every text/surface/border slot the recipes in use read
   * must be declared here. Only meaningful on a theme WITHOUT `extends` — a
   * theme that extends another inherits the base's semantic slots as resolved
   * and is never backfilled on top of them.
   */
  defaults?: boolean;
};

// Intent resolver types

export interface IntentResolverInput {
  intent: string;
  variant: string;
  /**
   * The fully-resolved theme, for resolvers that derive values from tokens or
   * vocabulary. The default resolver consults `theme.tokens.colors` to decide,
   * per intent, whether to branch into the ramp or single-shade variant-color
   * path (see the scale contract on `IntentResolver`); it does not read any
   * other part of the theme.
   *
   * Optional because most resolvers never read it, and requiring it forced
   * every resolver unit test to construct or import a whole `ResolvedTheme`
   * just to satisfy the type. The framework always passes it (see
   * `auto-vars.ts`), so a resolver that DOES derive from tokens still gets one
   * at runtime — it just has to narrow, which is the honest signature for a
   * value a direct caller may omit.
   */
  theme?: ResolvedTheme;
}

export interface IntentResolverResult {
  background: string;
  color: string;
  border: string;
  hover?: string;
  active?: string;
  hoverColor?: string;
}

/**
 * Maps `(intent, variant)` to concrete CSS values.
 *
 * Scale contract when using the DEFAULT resolver: `theme.tokens.colors[intent]`
 * decides which of the two built-in branches (`default-intent-resolver.ts`)
 * an intent gets, per intent. A scale with 3+ numeric shade keys must define
 * `500`, `600`, `700`, `800`, and `foreground` (text paired with the `500`
 * background) and is routed to the ramp branch. (`50`/`100`/`200` are NOT
 * required: near-canvas washes are computed at render time from `500` and
 * `--surface-canvas`, not looked up from the ramp -- see the `wash` helper.)
 * A scale with fewer than 3 numeric shade keys is routed to the single-shade
 * branch instead, keyed on its own canonical value (`500` if present, else
 * the first numeric-keyed entry) — no `600`/`700`/`800`/`foreground` required
 * there. Themes whose scales cannot satisfy either shape must supply their
 * own resolver here.
 */
export type IntentResolver = (input: IntentResolverInput) => IntentResolverResult;

// Component theme override types

export interface ComponentThemeConfig {
  defaultProps?: Record<string, unknown>;
  /** Resolved per-component vocabulary overrides (concrete Vocabulary objects only — function-form resolved at createTheme() time). */
  vocabulary?: {
    size?: Vocabulary;
    intent?: Vocabulary;
    variant?: Vocabulary;
  };
  classNames?:
    | Record<string, string>
    | ((theme: ResolvedTheme, props: Record<string, unknown>) => Record<string, string>);
  styles?:
    | Record<string, Record<string, string | number>>
    | ((
        theme: ResolvedTheme,
        props: Record<string, unknown>,
      ) => Record<string, Record<string, string | number>>);
  vars?: (
    theme: ResolvedTheme,
    props: Record<string, unknown>,
  ) => Record<string, Record<string, string>>;
  attributes?: Record<string, Record<string, unknown>>;
}

// Top-level theme types

export interface ThemeDefinition<V extends PartialThemeVocabulary = PartialThemeVocabulary> {
  tokens: ThemeTokens;
  dark?: PartialThemeTokens;

  /**
   * Declared vocabularies (size/intent/variant). createTheme() fills missing
   * axes from defaults. The `V` type parameter captures the consumer's exact
   * declaration so `createTheme` can preserve literal unions in its return type.
   */
  vocabulary?: V;

  /** Role-name aliases (text/surface/border/accent) — emitted as CSS vars. */
  semanticTokens?: PartialSemanticTokensConfig;

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
 * A theme definition whose `tokens` may be partial or omitted, for use where a
 * resolved base supplies the full set: the child side of `composeTheme` and
 * definitions that carry `extends`. Fresh themes keep the strict
 * `ThemeDefinition` contract so a standalone theme cannot silently lack
 * required token families.
 */
export type ComposableThemeDefinition<V extends PartialThemeVocabulary = PartialThemeVocabulary> =
  Omit<ThemeDefinition<V>, 'tokens'> & { tokens?: Partial<ThemeTokens> };

/**
 * Definition form for themes that extend a base. `E` captures the base's exact
 * type so `createTheme` can thread the base vocabulary into the resolved
 * result (see `VocabOfExtends`).
 */
export type ExtendingThemeDefinition<
  V extends PartialThemeVocabulary = PartialThemeVocabulary,
  E extends ComposableThemeDefinition = ComposableThemeDefinition,
> = Omit<ComposableThemeDefinition<V>, 'extends'> & { extends: E };

/**
 * The vocabulary a theme's `extends` value contributes at the TYPE level,
 * mirroring the runtime inheritance chain (child axis ?? base axis ?? default):
 *
 * - a resolved base (`extends: someResolvedTheme`) carries its exact vocabulary;
 *   a base typed as the wide `ResolvedTheme` yields honestly wide axes
 * - an inline definition resolves recursively: its declared axes over whatever
 *   its own `extends` contributes
 * - no base (or an unrecognizable one) yields the default vocabularies
 */
export type VocabOfExtends<E> =
  E extends ResolvedTheme<infer BV>
    ? BV
    : E extends { vocabulary: infer BV extends PartialThemeVocabulary }
      ? ResolveVocab<BV, ExtendsChainVocab<E>>
      : E extends { extends: unknown }
        ? ExtendsChainVocab<E>
        : DefaultVocabularies;

/** Recurses into whatever `E.extends` holds; absent means the defaults. */
type ExtendsChainVocab<E> = VocabOfExtends<E extends { extends: infer X } ? X : undefined>;

/**
 * The fully-resolved, normalized theme.
 *
 * Generic over its resolved vocabulary `V`, defaulting to the wide
 * `ThemeVocabulary`. The default makes every existing `(theme: ResolvedTheme)`
 * reference compile unchanged: a narrowed `ResolvedTheme<ResolveVocab<...>>` is
 * assignable to the default `ResolvedTheme` because each `Vocabulary<'literal'>`
 * is assignable to `Vocabulary<string>` (the same assignment createTheme already
 * performs when filling defaults). Builders thread `V` to narrow injected props.
 */
export interface ResolvedTheme<V extends ThemeVocabulary = ThemeVocabulary> {
  tokens: ThemeTokens;
  dark: PartialThemeTokens;
  vocabulary: V; // fully resolved
  semanticTokens: SemanticTokensConfig; // fully resolved
  intentResolver: IntentResolver;
  components: Record<string, ComponentThemeConfig>;
  scope: string;
  darkMode: { selector: string };
  name: string;
}
