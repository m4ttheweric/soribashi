import { theme } from './src/theme/index.ts';

/** The theme's declared size values, narrowed to a literal union for BUTTON_DIMENSIONS. */
type ButtonSize = NonNullable<(typeof theme.vocabulary.size)['type']>;

/**
 * Component dimension vars, emitted at codegen time via cssVariablesResolver.
 * Theme-driven and JIT-immune: recipes reference var(--button-height-md) etc.
 * through their vars resolvers; a theme that adds a size value adds a row here.
 * KEEP KEYS IN SYNC with theme vocabulary.size.
 */
/**
 * pxIcon is the donor's `has-[>svg]:px-*` step: a button whose direct child is
 * an icon tightens its horizontal padding one rung so the glyph does not sit in
 * a wide gutter.
 */
const BUTTON_DIMENSIONS: Record<ButtonSize, { height: string; px: string; pxIcon: string }> = {
  xs: { height: '1.75rem', px: '0.625rem', pxIcon: '0.375rem' },
  sm: { height: '2rem', px: '0.75rem', pxIcon: '0.625rem' },
  md: { height: '2.25rem', px: '1rem', pxIcon: '0.75rem' },
  lg: { height: '2.5rem', px: '1.5rem', pxIcon: '1rem' },
  xl: { height: '2.75rem', px: '2rem', pxIcon: '1.5rem' },
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
  label: string,
): void {
  const dimensionKeys = Object.keys(dimensions);
  const missing = vocabValues.filter((v) => !dimensionKeys.includes(v));
  const extra = dimensionKeys.filter((k) => !vocabValues.includes(k));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `[shadcn-starter] ${label} keys are out of sync with theme.vocabulary.size (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}).`,
    );
  }
}

assertKeysMatchVocabulary(BUTTON_DIMENSIONS, theme.vocabulary.size.values, 'BUTTON_DIMENSIONS');

/**
 * The donor badge has a single size (px-2 py-0.5 text-xs), which `sm` reproduces
 * exactly; the rest of the scale is this theme's own. No height row: the donor
 * sets none, so the box is padding plus line-height.
 */
const BADGE_DIMENSIONS: Record<ButtonSize, { px: string; py: string; fontSize: string }> = {
  xs: { px: '0.375rem', py: '0.0625rem', fontSize: '0.6875rem' },
  sm: { px: '0.5rem', py: '0.125rem', fontSize: '0.75rem' },
  md: { px: '0.625rem', py: '0.1875rem', fontSize: '0.75rem' },
  lg: { px: '0.75rem', py: '0.25rem', fontSize: '0.8125rem' },
  xl: { px: '1rem', py: '0.3125rem', fontSize: '0.875rem' },
};

assertKeysMatchVocabulary(BADGE_DIMENSIONS, theme.vocabulary.size.values, 'BADGE_DIMENSIONS');

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
            [`--button-px-icon-${size}`, d.pxIcon],
          ]),
        ),
        ...Object.fromEntries(
          Object.entries(BADGE_DIMENSIONS).flatMap(([size, d]) => [
            [`--badge-px-${size}`, d.px],
            [`--badge-py-${size}`, d.py],
            [`--badge-fs-${size}`, d.fontSize],
          ]),
        ),
      },
    }),
  },
  watch: ['./apps/shadcn-starter/src/theme/**/*'],
};
