import { defaultIntentResolver } from './default-intent-resolver.ts';
import type { ComponentThemeConfig, ResolvedTheme, SemanticTokens, ThemeDefinition } from './types.ts';
import { composeTheme } from './compose-theme.ts';

function normalizeComponents(
  input: ThemeDefinition['components'] | undefined,
): Record<string, ComponentThemeConfig> {
  if (input === undefined) return {};
  if (Array.isArray(input)) {
    const out: Record<string, ComponentThemeConfig> = {};
    for (const entry of input) {
      // Last-write-wins: later entries override earlier ones with the same name.
      out[entry.name] = { defaultProps: entry.defaultProps };
    }
    return out;
  }
  return input as Record<string, ComponentThemeConfig>;
}

const DEFAULT_INTENTS = ['primary', 'neutral', 'danger', 'success', 'warning', 'info'] as const;
const DEFAULT_VARIANTS = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;

const DEFAULT_TEXT: Record<string, string> = {
  default: 'colors.neutral.900',
  muted: 'colors.neutral.500',
  disabled: 'colors.neutral.400',
};

const DEFAULT_SURFACE: Record<string, string> = {
  canvas: 'colors.neutral.50',
  default: 'colors.neutral.0',
  raised: 'colors.neutral.100',
  sunken: 'colors.neutral.50',
  overlay: 'colors.neutral.900',
};

const DEFAULT_BORDER: Record<string, string> = {
  default: 'colors.neutral.200',
  strong: 'colors.neutral.400',
  muted: 'colors.neutral.100',
};

/**
 * Builds a normalized theme from a (potentially partial) `ThemeDefinition`.
 *
 * Resolution order:
 * 1. If `definition.extends` is provided, recursively resolve and merge.
 * 2. Apply user fields, falling back to defaults for any omitted field.
 */
export function createTheme(definition: ThemeDefinition): ResolvedTheme {
  const base: ResolvedTheme | null = definition.extends ? createTheme(definition.extends) : null;

  const merged: ThemeDefinition = base ? composeTheme(base, definition) : definition;

  const semantic: SemanticTokens = {
    intent: merged.semantic?.intent ?? DEFAULT_INTENTS,
    variant: merged.semantic?.variant ?? DEFAULT_VARIANTS,
    text: merged.semantic?.text ?? DEFAULT_TEXT,
    surface: merged.semantic?.surface ?? DEFAULT_SURFACE,
    border: merged.semantic?.border ?? DEFAULT_BORDER,
    ...(merged.semantic?.accent ? { accent: merged.semantic.accent } : {}),
  };

  return {
    tokens: merged.tokens,
    dark: merged.dark ?? {},
    semantic,
    intentResolver: merged.intentResolver ?? defaultIntentResolver,
    components: normalizeComponents(merged.components),
    scope: merged.scope ?? ':root',
    darkMode: merged.darkMode ?? { selector: '.dark' },
    name: merged.name ?? 'default',
  };
}
