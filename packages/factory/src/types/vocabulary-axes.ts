export type VocabularyAxis = 'size' | 'intent' | 'variant';

/**
 * Type-level prop shape injected by builders for opted-in axes.
 *
 * Caveat: with single-tenant module-level registration, the consumer's theme
 * type isn't reachable at builder definition time without a separate type bridge.
 * In this PR, the injected prop is typed as `string` (lossy) — the pilot-migration
 * PR can add tighter type inference via a separate hook (e.g., re-exporting typed
 * builders from createSoribashiBuilders that read the theme's vocab type).
 *
 * The runtime Zod check still enforces values; this typing decision affects only
 * autocomplete in recipe authoring, not safety.
 */
export type InjectedVocabularyProps<TAxes extends readonly VocabularyAxis[]> = {
  [K in TAxes[number]]?: string;
};
