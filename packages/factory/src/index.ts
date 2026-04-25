// @soribashi/factory — public API

// Daily-use authoring API
export { defineComponent } from './define-component.tsx';

// Provider
export { SoribashiProvider } from './provider/provider.tsx';
export { useTheme } from './provider/use-theme.ts';
export type { SoribashiProviderProps } from './provider/provider.tsx';

// Lower-level escape hatches
export { factory } from './factory.tsx';
export { useProps } from './hooks/use-props.ts';
export { useStyles } from './hooks/use-styles.ts';
export { createVarsResolver } from './create-vars-resolver.ts';

// Utilities
export { cn } from './cn.ts';
export type { ClassValue } from './cn.ts';

// Types
export type {
  FactoryPayload,
  FactoryProps,
  FactoryStylesNames,
  FactoryVars,
  StylesApiProps,
  ClassNames,
  Styles,
  Vars,
  Attributes,
  RenderContext,
  GetStylesFn,
  GetStylesResult,
  GetStylesOptions,
} from './types/index.ts';

export type { FactoryComponent } from './factory.tsx';
export type { DefineComponentConfig } from './define-component.tsx';
export type { UseStylesConfig } from './hooks/use-styles.ts';
