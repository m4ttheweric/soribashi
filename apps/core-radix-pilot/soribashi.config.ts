import { theme } from './src/theme/index.ts';

export default {
  theme,
  output: {
    css: './apps/core-radix-pilot/src/generated/theme.css',
    tailwind: {
      mode: 'v3' as const,
      configPath: './apps/core-radix-pilot/src/generated/tailwind.config.generated.js',
    },
  },
  watch: ['./apps/core-radix-pilot/src/theme/**/*'],
};
