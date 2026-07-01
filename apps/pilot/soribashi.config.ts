import { theme } from './src/theme/index.ts';

export default {
  theme,
  output: {
    css: './apps/pilot/src/generated/theme.css',
    tailwind: {
      mode: 'v3' as const,
      configPath: './apps/pilot/src/generated/tailwind.config.generated.js',
    },
  },
  watch: ['./apps/pilot/src/theme/**/*'],
};
