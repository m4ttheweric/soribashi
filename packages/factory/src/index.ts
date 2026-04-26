// @soribashi/factory — public API

// Daily-use authoring API
export { defineComponent } from './define-component.tsx';
export { definePolymorphicComponent } from './define-polymorphic-component.tsx';
export { defineGenericComponent } from './define-generic-component.tsx';

// Provider
export { SoribashiProvider } from './provider/provider.tsx';
export { useTheme } from './provider/use-theme.ts';
export type { SoribashiProviderProps } from './provider/provider.tsx';

// Lower-level escape hatches
export { factory } from './factory.tsx';
export { polymorphicComponent } from './polymorphic-component.tsx';
export { genericComponent } from './generic-component.tsx';
export { useProps } from './hooks/use-props.ts';
export { useStyles } from './hooks/use-styles.ts';
export { createVarsResolver } from './create-vars-resolver.ts';

// Utilities
export { cn } from './cn.ts';
export type { ClassValue } from './cn.ts';
export { useRandomClassName } from './use-random-class-name.ts';
export { hashStyleProps } from './hash-style-props.ts';
export { InlineStyles } from './inline-styles/InlineStyles.tsx';
export type { InlineStylesProps } from './inline-styles/InlineStyles.tsx';

// Types
export type {
  FactoryPayload,
  FactoryProps,
  FactoryStylesNames,
  FactoryVars,
  StylesApiProps,
  CompoundStylesApiProps,
  ClassNames,
  Styles,
  Vars,
  Attributes,
  RenderContext,
  GetStylesFn,
  GetStylesResult,
  GetStylesOptions,
} from './types/index.ts';

export type {
  PolymorphicProps,
  PolymorphicRef,
  PolymorphicComponentProps,
  SoribashiPolymorphicComponent,
  PolymorphicRenderProps,
} from './types/polymorphic.ts';

export type { FactoryComponent } from './factory.tsx';
export type { DefineComponentConfig } from './define-component.tsx';
export type { DefinePolymorphicComponentConfig } from './define-polymorphic-component.tsx';
export type { DefineGenericComponentConfig } from './define-generic-component.tsx';
export type { UseStylesConfig } from './hooks/use-styles.ts';
