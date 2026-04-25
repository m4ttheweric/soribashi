import { theme } from './apps/playground/src/theme/index.ts';

export default {
  theme,
  output: {
    css: './apps/playground/src/generated/theme.css',
    tailwind: {
      mode: 'v3' as const,
      configPath: './apps/playground/src/generated/tailwind.config.generated.js',
    },
  },
  watch: ['./apps/playground/src/theme/**/*'],
};
