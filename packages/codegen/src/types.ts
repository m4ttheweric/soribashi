import type { ResolvedTheme } from '@soribashi/theme';

export interface CodegenOutput {
  /** Path (relative to project root) where theme.css will be written */
  css: string;
  /** Optional Tailwind output config */
  tailwind?: TailwindOutput;
}

export type TailwindOutput =
  | { mode: 'v3'; configPath: string }
  | { mode: 'v4'; themeCssPath: string }
  | { mode: 'both'; configPath: string; themeCssPath: string };

export interface CodegenConfig {
  theme: ResolvedTheme;
  output: CodegenOutput;
  /** Glob patterns to watch in dev mode */
  watch?: string[];
}
