import { theme } from './src/theme/index.ts';

/** The theme's declared size values, narrowed to a literal union for BUTTON_DIMENSIONS. */
type ButtonSize = NonNullable<(typeof theme.vocabulary.size)['type']>;

/**
 * Component dimension vars, emitted at codegen time via cssVariablesResolver.
 * Theme-driven and JIT-immune: recipes reference var(--button-height-md) etc.
 * through their vars resolvers; a theme that adds a size value adds a row here.
 * KEEP KEYS IN SYNC with theme vocabulary.size.
 */
const BUTTON_DIMENSIONS: Record<ButtonSize, { height: string; px: string }> = {
  xs: { height: '1.75rem', px: '0.625rem' },
  sm: { height: '2rem', px: '0.75rem' },
  md: { height: '2.25rem', px: '1rem' },
  lg: { height: '2.5rem', px: '1.5rem' },
  xl: { height: '2.75rem', px: '2rem' },
};

/**
 * Guards against BUTTON_DIMENSIONS drifting from theme.vocabulary.size. The type
 * annotation above only helps under a type checker; this config runs through
 * `bun run codegen:shadcn-starter`, which strips types without checking them, so
 * the runtime check is what actually catches drift.
 */
function assertKeysMatchVocabulary(
  dimensions: Record<string, unknown>,
  vocabValues: readonly string[],
): void {
  const dimensionKeys = Object.keys(dimensions);
  const missing = vocabValues.filter((v) => !dimensionKeys.includes(v));
  const extra = dimensionKeys.filter((k) => !vocabValues.includes(k));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `[shadcn-starter] BUTTON_DIMENSIONS keys are out of sync with theme.vocabulary.size (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}).`,
    );
  }
}

assertKeysMatchVocabulary(BUTTON_DIMENSIONS, theme.vocabulary.size.values);

type BadgeSize = NonNullable<(typeof theme.vocabulary.size)['type']>;

const BADGE_DIMENSIONS: Record<BadgeSize, { height: string; px: string; fontSize: string }> = {
  xs: { height: '1.125rem', px: '0.375rem', fontSize: '0.625rem' },
  sm: { height: '1.25rem', px: '0.5rem', fontSize: '0.6875rem' },
  md: { height: '1.375rem', px: '0.625rem', fontSize: '0.75rem' },
  lg: { height: '1.5rem', px: '0.75rem', fontSize: '0.8125rem' },
  xl: { height: '1.75rem', px: '1rem', fontSize: '0.875rem' },
};

assertKeysMatchVocabulary(BADGE_DIMENSIONS, theme.vocabulary.size.values);

export default {
  theme,
  output: {
    css: './apps/shadcn-starter/src/generated/theme.css',
    tailwind: {
      mode: 'v4' as const,
      themeCssPath: './apps/shadcn-starter/src/generated/tailwind.css',
    },
  },
  emit: {
    cssVariablesResolver: () => ({
      root: {
        ...Object.fromEntries(
          Object.entries(BUTTON_DIMENSIONS).flatMap(([size, d]) => [
            [`--button-height-${size}`, d.height],
            [`--button-px-${size}`, d.px],
          ]),
        ),
        ...Object.fromEntries(
          Object.entries(BADGE_DIMENSIONS).flatMap(([size, d]) => [
            [`--badge-height-${size}`, d.height],
            [`--badge-px-${size}`, d.px],
            [`--badge-fs-${size}`, d.fontSize],
          ]),
        ),
      },
    }),
  },
  watch: ['./apps/shadcn-starter/src/theme/**/*'],
};
