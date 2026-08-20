import { composeTheme } from './compose-theme.ts';
import { defaultIntentResolver } from './default-intent-resolver.ts';
import { DEFAULT_VOCABULARIES } from './default-vocabularies.ts';
import { normalizeComponents } from './normalize-components.ts';
import { defaultTokens } from './tokens/index.ts';
import type {
  ComposableThemeDefinition,
  ExtendingThemeDefinition,
  PartialThemeVocabulary,
  ResolvedTheme,
  ResolveVocab,
  SemanticSurfaceValue,
  SemanticTokensConfig,
  ThemeDefinition,
  ThemeTokens,
  ThemeVocabulary,
  VocabOfExtends,
} from './types.ts';

const DEFAULT_TEXT: Record<string, string> = {
  default: 'colors.neutral.900',
  // Controller ruling (slice-2-layout task 8): previously 'colors.neutral.500'.
  // packages/ui's contrast matrix (Text's SMALL_COVERAGE cells, dimmed state,
  // light scheme) measured neutral.500 at 4.490:1 against surface.canvas and
  // 4.288:1 against surface.raised, both below the 4.5:1 AA floor for normal
  // text. Rule encoded here: text.muted must clear AA (>= 4.5:1) against BOTH
  // surface.canvas and surface.raised, in both colour schemes, since a
  // muted-text recipe (e.g. Text with `dimmed`) can render on either surface.
  // neutral.600 clears both (re-measured after this change; see the task 8
  // report for the exact ratios). The raw neutral.500 swatch is left
  // untouched for non-text uses; only this semantic reference moves.
  muted: 'colors.neutral.600',
  disabled: 'colors.neutral.400',
};

const DEFAULT_SURFACE: Record<string, SemanticSurfaceValue> = {
  canvas: 'colors.neutral.50',
  default: 'colors.neutral.0',
  raised: 'colors.neutral.100',
  sunken: 'colors.neutral.50',
  // Raw value on purpose: a neutral-scale reference inverts under the default
  // dark tokens, turning the scrim near-white. A scrim must stay dark in both
  // schemes, so it bypasses the ramp entirely.
  overlay: 'oklch(0.2064 0.0388 265.55 / 0.6)',
  // Every other slot here sits within one ramp step of the canvas, which is
  // right for a real surface and far too faint for a placeholder that has to
  // read as absent content, so a recipe like Skeleton needs a slot of its own
  // rather than a raw `--color-neutral-*` reach. It lives in the default set
  // (not only in a consumer theme) because a theme that declares no
  // `semanticTokens` at all still has to render that recipe: without a default
  // the custom property is never emitted and the element paints transparent.
  // Two ramp positions rather than one: WCAG relative luminance is not
  // scheme-symmetric for a fixed rung-count gap, since the dark tail of the
  // ramp compresses harder than the light head.
  placeholder: { value: 'colors.neutral.200', dark: 'colors.neutral.400' },
};

const DEFAULT_BORDER: Record<string, string> = {
  default: 'colors.neutral.200',
  strong: 'colors.neutral.400',
  muted: 'colors.neutral.100',
};

/**
 * The semantic slots `createTheme` backfills into a FRESH theme (one without
 * `extends`) that did not declare them itself, exposed so tooling can tell a
 * backfilled slot from an authored one.
 *
 * Every reference here resolves against the `neutral` colour family, which is
 * why a from-scratch theme whose palette has no `neutral` ramp fails
 * validation on slots it never wrote. codegen's `validateTheme` reads this map
 * to say so in the error instead of only naming the unresolved reference;
 * authors who genuinely have no neutral ramp opt the backfill out with
 * `semanticTokens: { defaults: false }`.
 */
export const DEFAULT_SEMANTIC_TOKENS: {
  readonly text: Readonly<Record<string, string>>;
  readonly surface: Readonly<Record<string, SemanticSurfaceValue>>;
  readonly border: Readonly<Record<string, string>>;
} = {
  text: DEFAULT_TEXT,
  surface: DEFAULT_SURFACE,
  border: DEFAULT_BORDER,
};

/**
 * Breakpoint tokens are structural, not aesthetic: blocks' responsive style
 * props and visibility.css derive `(min-width: ...)` queries from them, so a
 * theme without any breakpoints breaks responsiveness outright (everything
 * collapses to `(min-width: 0)`). Backfill this one family from the defaults.
 * Other families are intentionally NOT backfilled; teams replace those
 * wholesale and expect the theme to contain exactly what they declared.
 */
function withBreakpointFallback(tokens: ThemeTokens): ThemeTokens {
  if (tokens.breakpoint && Object.keys(tokens.breakpoint).length > 0) return tokens;
  return { ...tokens, breakpoint: { ...defaultTokens.breakpoint } };
}

/**
 * Builds a normalized theme from a (potentially partial) `ThemeDefinition`.
 *
 * Resolution order:
 * 1. If `definition.extends` is provided, recursively resolve and merge.
 * 2. Apply user fields, falling back to defaults for any omitted field.
 *
 * Two call forms:
 * - with `extends`, tokens may be partial or omitted (the base supplies the
 *   rest) and omitted vocabulary axes inherit the BASE's axes, which the
 *   return type reflects via `VocabOfExtends`
 * - without `extends`, tokens are required in full and omitted axes resolve
 *   to the default vocabularies
 */
export function createTheme<
  const V extends PartialThemeVocabulary = PartialThemeVocabulary,
  const E extends ComposableThemeDefinition = ComposableThemeDefinition,
>(definition: ExtendingThemeDefinition<V, E>): ResolvedTheme<ResolveVocab<V, VocabOfExtends<E>>>;
export function createTheme<const V extends PartialThemeVocabulary = PartialThemeVocabulary>(
  definition: ThemeDefinition<V>,
): ResolvedTheme<ResolveVocab<V>>;
export function createTheme(definition: ComposableThemeDefinition): ResolvedTheme {
  return resolveTheme(definition);
}

// The non-overloaded worker: the overloads above narrow the vocabulary for
// callers (the runtime fills omitted axes from the base or the defaults, which
// ResolveVocab/VocabOfExtends mirror at the type level); internally everything
// is honestly wide.
function resolveTheme(definition: ComposableThemeDefinition): ResolvedTheme {
  const base: ResolvedTheme | null = definition.extends ? resolveTheme(definition.extends) : null;

  // composeTheme rejects a child carrying `extends` (it cannot resolve one);
  // it is already resolved into `base` here, so strip it before composing.
  const { extends: _resolved, ...childDefinition } = definition;
  const merged = base ? composeTheme(base, childDefinition) : childDefinition;

  const vocabulary: ThemeVocabulary = {
    size: merged.vocabulary?.size ?? DEFAULT_VOCABULARIES.size,
    intent: merged.vocabulary?.intent ?? DEFAULT_VOCABULARIES.intent,
    variant: merged.vocabulary?.variant ?? DEFAULT_VOCABULARIES.variant,
  };

  // Per-key merge over the defaults, matching composeTheme's per-slot merge:
  // declaring `surface.brand` must not delete `surface.default` and friends.
  //
  // Two conditions gate the backfill:
  // - `semanticTokens.defaults: false` opts out (see the field's doc comment).
  //   The flag is carried onto the resolved theme and inherited by children,
  //   so the opt-out survives both `extends` and re-resolution of an already
  //   resolved theme.
  // - a theme WITH a base does not re-backfill. The base was itself resolved
  //   through this function, so composeTheme has already merged whatever the
  //   base ended up with; re-applying the defaults here is a no-op when the
  //   base opted in and would silently undo the opt-out when it did not.
  const optedOut =
    definition.semanticTokens?.defaults === false || base?.semanticTokens.defaults === false;
  const backfillDefaults = base === null && !optedOut;
  const semanticTokens: SemanticTokensConfig = {
    text: { ...(backfillDefaults ? DEFAULT_TEXT : {}), ...merged.semanticTokens?.text },
    surface: { ...(backfillDefaults ? DEFAULT_SURFACE : {}), ...merged.semanticTokens?.surface },
    border: { ...(backfillDefaults ? DEFAULT_BORDER : {}), ...merged.semanticTokens?.border },
    ...(merged.semanticTokens?.accent ? { accent: merged.semanticTokens.accent } : {}),
    ...(optedOut ? { defaults: false as const } : {}),
  };

  // The empty-family fallback only fires for untyped callers: the overloads
  // require full tokens exactly when there is no base to supply them.
  const tokens: ThemeTokens = {
    colors: {},
    radius: {},
    spacing: {},
    fontSize: {},
    ...merged.tokens,
  } as ThemeTokens;

  return {
    tokens: withBreakpointFallback(tokens),
    dark: merged.dark ?? {},
    vocabulary,
    semanticTokens,
    intentResolver: merged.intentResolver ?? defaultIntentResolver,
    components: normalizeComponents(merged.components, vocabulary),
    scope: merged.scope ?? ':root',
    darkMode: merged.darkMode ?? { selector: '.dark' },
    name: merged.name ?? 'default',
  };
}
