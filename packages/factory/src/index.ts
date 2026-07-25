// @soribashi/factory — public API

export type { VocabularyOverride } from '@soribashi/theme';
export { autoVars } from './auto-vars.ts';
export type { ClassValue } from './cn.ts';
export { cn, configureClassNameMerge } from './cn.ts';
// Vocab-aware builder factory. `makeBuilders` + `registerTheme` are the
// cycle-safe split (type-only theme in builders.ts, value registration at app
// entry); `createSoribashiBuilders` is the combined convenience.
export { createSoribashiBuilders, makeBuilders, registerTheme } from './create-builders.ts';
export { createVarsResolver } from './create-vars-resolver.ts';
export type { DefineComponentConfig } from './define-component.tsx';
export { defineComponent } from './define-component.tsx';
export type {
  DefineCompoundConfig,
  PartConfig,
  PartRenderCtx,
  PolymorphicPartConfig,
  PolymorphicPartRenderCtx,
  StandardPartConfig,
} from './define-compound.tsx';
export { defineCompound } from './define-compound.tsx';
export type {
  DefineGenericComponentConfig,
  GenericRenderCtx,
} from './define-generic-component.tsx';
export { defineGenericComponent } from './define-generic-component.tsx';
export type {
  DefinePolymorphicComponentConfig,
  PolymorphicRenderCtx,
} from './define-polymorphic-component.tsx';
export { definePolymorphicComponent } from './define-polymorphic-component.tsx';
export type { FactoryComponent } from './factory.tsx';
export { factory } from './factory.tsx';
export { genericComponent } from './generic-component.tsx';
export { hashStyleProps } from './hash-style-props.ts';
export { useProps } from './hooks/use-props.ts';
export type { UseStylesConfig } from './hooks/use-styles.ts';
export { useStyles } from './hooks/use-styles.ts';
export type { InlineStylesProps } from './inline-styles/InlineStyles.tsx';
export { InlineStyles } from './inline-styles/InlineStyles.tsx';
export { polymorphicComponent } from './polymorphic-component.tsx';
export type { SoribashiProviderProps } from './provider/provider.tsx';
export { SoribashiProvider } from './provider/provider.tsx';
export { useTheme } from './provider/use-theme.ts';
export type { SlotProps } from './slot.tsx';

// asChild slot-merging primitive
export { Slot } from './slot.tsx';
export type { ThemeComponentEntry } from './theme-component-entry.ts';
export { isThemeComponentEntry } from './theme-component-entry.ts';
export type { ComponentExtendConfig } from './types/component-extend.ts';
export type {
  Attributes,
  ClassNames,
  CompoundStylesApiProps,
  FactoryPayload,
  FactoryProps,
  FactoryStylesNames,
  FactoryVars,
  GetStylesFn,
  GetStylesOptions,
  GetStylesResult,
  RenderContext,
  Styles,
  StylesApiProps,
  Vars,
} from './types/index.ts';
export type {
  PolymorphicComponentProps,
  PolymorphicProps,
  PolymorphicRef,
  PolymorphicRenderProps,
  SoribashiPolymorphicComponent,
} from './types/polymorphic.ts';
export { useRandomClassName } from './use-random-class-name.ts';
