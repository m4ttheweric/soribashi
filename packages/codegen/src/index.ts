// @soribashi/codegen — public API

export type { BuildResult } from './build.ts';
export { build } from './build.ts';
export type { CliOptions } from './cli.ts';
export { runCli } from './cli.ts';
export { emitCss } from './emit-css.ts';
export { emitLayerDeclaration } from './emit-layer.ts';
export { emitPropertyRegistrations } from './emit-property.ts';
export type { EmitTailwindV4Options, SpacingUtilitiesMode } from './emit-tailwind-v4.ts';
export { emitTailwindV4 } from './emit-tailwind-v4.ts';
export { emitVisibilityUtilities } from './emit-visibility.ts';
export { loadConfig } from './load-config.ts';
export type {
  CodegenConfig,
  CodegenOutput,
  CssVariablesAddition,
  CssVariablesResolver,
  EmitCssOptions,
  TailwindOutput,
} from './types.ts';
export type { WatchHandle, WatchOptions } from './watch.ts';
export { watch } from './watch.ts';
