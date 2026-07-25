import { uiTheme } from './packages/ui/src/theme.ts';

export default {
  theme: uiTheme,
  output: { css: 'apps/workshop/src/generated/theme.css' },
  watch: ['packages/ui/src/theme.ts', 'packages/theme/src/**/*.ts'],
};
