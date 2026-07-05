import { theme } from './src/theme/index.ts';

/**
 * Component dimension vars, emitted at codegen time via cssVariablesResolver.
 * Theme-driven and JIT-immune: recipes reference var(--button-height-md) etc.
 * through their vars resolvers; a theme that adds a size value adds a row here.
 * KEEP KEYS IN SYNC with theme vocabulary.size.
 */
const BUTTON_DIMENSIONS: Record<string, { height: string; px: string }> = {
  xs: { height: '1.75rem', px: '0.625rem' },
  sm: { height: '2rem', px: '0.75rem' },
  md: { height: '2.25rem', px: '1rem' },
  lg: { height: '2.5rem', px: '1.5rem' },
  xl: { height: '2.75rem', px: '2rem' },
};

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
      root: Object.fromEntries(
        Object.entries(BUTTON_DIMENSIONS).flatMap(([size, d]) => [
          [`--button-height-${size}`, d.height],
          [`--button-px-${size}`, d.px],
        ]),
      ),
    }),
  },
  watch: ['./apps/shadcn-starter/src/theme/**/*'],
};
