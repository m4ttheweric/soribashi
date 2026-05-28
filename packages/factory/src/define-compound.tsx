import {
  forwardRef,
  useContext,
  type CSSProperties,
  type ElementType,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { createSafeContext } from './create-safe-context.ts';
import { validateVocabularyProps } from './validate-vocabulary-props.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { ComponentExtendConfig } from './types/component-extend.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { GetStylesFn, GetStylesOptions, GetStylesResult } from './types/render-context.ts';
import type { StylesApiProps, CompoundStylesApiProps } from './types/props.ts';
import type { PolymorphicComponentProps } from './types/polymorphic.ts';
import type { VocabularyAxis, InjectedVocabularyProps } from './types/vocabulary-axes.ts';

// ---------------------------------------------------------------------------
// Part render context types
// ---------------------------------------------------------------------------

/**
 * Object passed to each standard part's `render` function.
 *
 * TVariants defaults to `readonly string[]` so that callers which don't
 * explicitly pass the variants tuple (e.g. `PartRenderCtx<P, Ctx>`) continue
 * to compile: `ctx.variant` is just `string | undefined` in that case.
 *
 * TSlotKeys defaults to `string` for backwards compatibility when not derived
 * from config.classes; when defineCompound infers TSlotKeys from config.classes,
 * typos like `getStyles({ part: 'arroow' })` are caught at compile time.
 */
export interface PartRenderCtx<
  TProps = unknown,
  TCtxExtra = object,
  TVariants extends readonly string[] = readonly string[],
  TSlotKeys extends string = string,
> {
  props: TProps;
  /**
   * Returns merged className/style/data-* for the given slot (defaults to this
   * part's own slot). Pass `{ part: 'otherSlot' }` to target sibling slots.
   *
   * All `GetStylesOptions` fields (`className`, `style`, `classNames`, `styles`,
   * `active`, `variant`) are forwarded to the underlying `useStyles` closure, so
   * per-call overrides compose on top of root-level and theme-level styles.
   */
  getStyles: (opts?: { part?: TSlotKeys } & GetStylesOptions) => GetStylesResult;
  ctx: TCtxExtra & { variant: TVariants[number] | undefined };
  children?: ReactNode;
  ref: Ref<unknown>;
}

/**
 * Object passed to each polymorphic part's `render` function.
 */
export interface PolymorphicPartRenderCtx<
  TProps = unknown,
  TCtxExtra = object,
  TVariants extends readonly string[] = readonly string[],
  TSlotKeys extends string = string,
> extends PartRenderCtx<TProps, TCtxExtra, TVariants, TSlotKeys> {
  Element: keyof JSX.IntrinsicElements;
}

// ---------------------------------------------------------------------------
// Part config types
// ---------------------------------------------------------------------------

export interface StandardPartConfig<TProps, TCtxExtra, TVariants extends readonly string[] = readonly string[]> {
  render: (ctx: PartRenderCtx<TProps, TCtxExtra, TVariants>) => ReactNode;
  defaults?: Partial<TProps>;
}

/**
 * Polymorphic-part config. Standalone (NOT `extends StandardPartConfig`) by
 * design — extending would force `render`'s parameter type to be a contravariant
 * subtype of StandardPartConfig.render's (PartRenderCtx), which TypeScript
 * rejects with TS2430 because PolymorphicPartRenderCtx adds fields (Element,
 * ref) that PartRenderCtx lacks. Wave 3 in-wave factory fix (Task 3.5) settled
 * on the standalone shape; do not re-introduce `extends StandardPartConfig`
 * without first solving the variance constraint. See OQ-7 in the Wave 3 spec.
 */
export interface PolymorphicPartConfig<TProps, TCtxExtra, TVariants extends readonly string[] = readonly string[]> {
  polymorphic: true;
  defaultElement: keyof JSX.IntrinsicElements;
  render: (ctx: PolymorphicPartRenderCtx<TProps, TCtxExtra, TVariants>) => ReactNode;
  defaults?: Partial<TProps>;
}

export type PartConfig<TProps, TCtxExtra, TVariants extends readonly string[] = readonly string[]> =
  | StandardPartConfig<TProps, TCtxExtra, TVariants>
  | PolymorphicPartConfig<TProps, TCtxExtra, TVariants>;

// ---------------------------------------------------------------------------
// Public config type
// ---------------------------------------------------------------------------

/** Extract TProps from a PartConfig<TProps, any, any>; falls back to Record<string, unknown> for untyped configs */
type ExtractPartProps<C> = C extends PartConfig<infer P, any, any>
  ? [P] extends [never]
    ? Record<string, unknown>
    : unknown extends P
      ? Record<string, unknown>
      : P
  : Record<string, unknown>;

/**
 * Loose per-part constraint used for the TParts generic bound.
 *
 * Using PartConfig<any, ...> as the per-value bound prevents TypeScript from
 * contextually narrowing inline render functions when the parts object is typed
 * as Record<string, Standard | Polymorphic> — the union kills inference and
 * forces callers to annotate every render parameter. By constraining to a
 * minimal structural shape instead, TypeScript infers the render param type
 * from context (PartRenderCtx for plain parts, PolymorphicPartRenderCtx for
 * parts with polymorphic: true), eliminating spurious annotation requirements.
 */
type AnyPartConfig = {
  render: (ctx: any) => ReactNode;
  defaults?: any;
  polymorphic?: true;
  defaultElement?: keyof JSX.IntrinsicElements;
};

/** Constrain parts map — each value must satisfy the minimal AnyPartConfig shape */
type PartsRecord = Record<string, AnyPartConfig>;

export interface DefineCompoundConfig<
  TParts extends PartsRecord,
  TVariants extends readonly string[] = readonly [],
  TCtxExtra extends object = object,
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
> {
  name: string;
  vocabularyAxes?: TVocabAxes;
  variants?: TVariants;
  classes?: Partial<Record<string, string>>;
  defaults?: Partial<ExtractPartProps<TParts['root']> & InjectedVocabularyProps<TVocabAxes>>;
  vars?: (
    theme: ResolvedTheme,
    props: ExtractPartProps<TParts['root']>,
  ) => Partial<Record<string, Record<string, string>>>;
  context?: (rootProps: ExtractPartProps<TParts['root']>) => TCtxExtra;
  parts: TParts & { root: AnyPartConfig };
}

// ---------------------------------------------------------------------------
// Internal context value shape
// ---------------------------------------------------------------------------

/**
 * A concrete FactoryPayload where stylesNames is `string` (not `string | undefined`)
 * so that GetStylesFn<ConcreteFactoryPayload> resolves to (selector: string, ...) => ...
 * rather than (selector: never, ...) => ...
 */
type ConcreteFactoryPayload = FactoryPayload & { stylesNames: string };

interface CompoundContextValue<TCtxExtra, TVariants extends readonly string[] = readonly string[]> {
  variant: TVariants[number] | undefined;
  /**
   * The full `useStyles` closure stored in context so each part can forward
   * its own instance-level styles-API props (className, style, classNames,
   * styles) via the options argument rather than dropping them.
   */
  getStyles: GetStylesFn<ConcreteFactoryPayload>;
  ctxExtras: TCtxExtra;
}

// ---------------------------------------------------------------------------
// Return type helpers
// ---------------------------------------------------------------------------

/**
 * Constructs a minimal FactoryPayload from a part config so that StylesApiProps /
 * CompoundStylesApiProps can be parameterised without needing the full payload.
 */
type PartPayload<TPartConfig> = {
  props: ExtractPartProps<TPartConfig>;
  stylesNames: string;
} & FactoryPayload;

/**
 * Static methods shared by all part component shapes (polymorphic and standard).
 */
type PartStaticMethods<TPartConfig> = {
  extend: (
    config: ComponentExtendConfig<ExtractPartProps<TPartConfig> & CompoundStylesApiProps<PartPayload<TPartConfig>>>,
  ) => ThemeComponentEntry<ExtractPartProps<TPartConfig> & CompoundStylesApiProps<PartPayload<TPartConfig>>>;
  displayName?: string;
};

/**
 * Type shape for a polymorphic compound part.
 * The component is generic over the target element type at the call site —
 * mirrors `PolymorphicComponentLike` from `define-polymorphic-component.tsx`.
 * `<Foo.Trigger as="a" href="/x">` correctly narrows props to anchor attrs.
 */
type PolymorphicCompoundPart<TPartConfig, TDefaultEl extends ElementType> =
  (<TAs extends ElementType = TDefaultEl>(
    props: PolymorphicComponentProps<TAs, ExtractPartProps<TPartConfig> & CompoundStylesApiProps<PartPayload<TPartConfig>>>,
  ) => React.ReactElement | null) & PartStaticMethods<TPartConfig>;

type PartsNamespace<TParts extends Record<string, PartConfig<any, any, any>>> = {
  [K in Exclude<keyof TParts, 'root'> as Capitalize<K & string>]:
    TParts[K] extends PolymorphicPartConfig<any, any, any> & { defaultElement: infer DefaultEl }
      ? DefaultEl extends ElementType
        ? PolymorphicCompoundPart<TParts[K], DefaultEl>
        : never
      : React.ForwardRefExoticComponent<
          ExtractPartProps<TParts[K]>
          & CompoundStylesApiProps<PartPayload<TParts[K]>>
          & React.RefAttributes<unknown>
        > & PartStaticMethods<TParts[K]>;
};

type CompoundComponent<TParts extends Record<string, PartConfig<any, any, any>>> =
  React.ForwardRefExoticComponent<
    ExtractPartProps<TParts['root']>
    & StylesApiProps<PartPayload<TParts['root']>>
    & React.RefAttributes<unknown>
  > & PartsNamespace<TParts> & {
    extend: (
      config: ComponentExtendConfig<ExtractPartProps<TParts['root']> & StylesApiProps<PartPayload<TParts['root']>>>,
    ) => ThemeComponentEntry<ExtractPartProps<TParts['root']> & StylesApiProps<PartPayload<TParts['root']>>>;
    displayName?: string;
  };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Returns a Proxy that throws a named error on any property access.
 * Used when a part is rendered outside Root but still receives a `ctx` argument —
 * passthrough parts that ignore `ctx` are unaffected; context-consuming parts
 * see the friendly error rather than a null-deref TypeError.
 */
function makeNullCtxProxy(compoundName: string, partKey: string): Record<string, unknown> {
  return new Proxy({} as Record<string, unknown>, {
    get() {
      throw new Error(
        `<${compoundName}.${capitalize(partKey)}> must be inside <${compoundName}>`,
      );
    },
  });
}


// ---------------------------------------------------------------------------
// defineCompound
// ---------------------------------------------------------------------------

export function defineCompound<
  TParts extends PartsRecord,
  const TVariants extends readonly string[] = readonly [],
  TCtxExtra extends object = object,
  TClasses extends Partial<Record<string, string>> = Partial<Record<string, string>>,
  TVocabAxes extends readonly VocabularyAxis[] = readonly [],
>(config: DefineCompoundConfig<TParts, TVariants, TCtxExtra, TVocabAxes> & { classes?: TClasses }): CompoundComponent<TParts> {
  if (!config.parts.root) {
    throw new Error(`defineCompound("${config.name}") requires parts.root`);
  }

  // Disallow polymorphic root (spec § 3.6).
  if ((config.parts.root as PolymorphicPartConfig<any, any>).polymorphic) {
    throw new Error(
      `defineCompound("${config.name}") root part cannot be polymorphic; declare polymorphism on a child part instead.`,
    );
  }

  // createSafeContext returns [Context, useSafeHook]. We keep the safe hook for
  // Root's own usage (not currently needed) but use raw useContext in parts so
  // that passthrough parts (class-3) can render outside Root without throwing.
  const [CompoundContext] = createSafeContext<CompoundContextValue<TCtxExtra, TVariants>>(
    `${config.name} parts must be inside <${config.name}>`,
  );

  // -------------------------------------------------------------------------
  // Root component
  // -------------------------------------------------------------------------

  type TRootProps = ExtractPartProps<TParts['root']>;

  const Root = forwardRef<unknown, TRootProps>(function CompoundRoot(rawProps, ref) {
    const merged = useProps<TRootProps>(
      config.name,
      (config.defaults ?? null) as Partial<TRootProps> | null,
      rawProps as TRootProps,
    );

    validateVocabularyProps(config.name, config.vocabularyAxes ?? [], merged as Record<string, unknown>);

    const getStyles = useStyles<FactoryPayload>({
      name: config.name,
      classes: config.classes as Record<string, string> | undefined,
      className: (merged as { className?: string }).className,
      style: (merged as { style?: CSSProperties }).style,
      classNames: (merged as { classNames?: unknown }).classNames as never,
      styles: (merged as { styles?: unknown }).styles as never,
      attributes: (merged as { attributes?: unknown }).attributes as never,
      unstyled: (merged as { unstyled?: unknown }).unstyled as never,
      props: merged as Record<string, any>,
      varsResolver: config.vars
        ? (theme: ResolvedTheme, props: Record<string, any>) =>
            config.vars!(theme, props as TRootProps) as never
        : undefined,
    });

    const variant = (merged as { variant?: string }).variant as TVariants[number] | undefined;
    const ctxExtras = config.context ? config.context(merged) : ({} as TCtxExtra);

    const ctxValue: CompoundContextValue<TCtxExtra, TVariants> = {
      variant,
      getStyles: getStyles as GetStylesFn<ConcreteFactoryPayload>,
      ctxExtras,
    };

    /**
     * Root's getStyles adapter. For the root selector the root instance
     * className/style are already baked into the useStyles config, so we
     * don't forward them again to avoid doubling. Cross-slot calls
     * (opts.part !== 'root') forward nothing extra — root doesn't carry
     * per-part classNames/styles at this level.
     */
    const rootGetStyles = (opts?: { part?: string } & GetStylesOptions): GetStylesResult =>
      (getStyles as GetStylesFn<ConcreteFactoryPayload>)(
        (opts?.part ?? 'root') as string,
        opts ? { active: opts.active, variant: opts.variant, className: opts.className, style: opts.style, classNames: opts.classNames, styles: opts.styles } : undefined,
      );

    return (
      <CompoundContext.Provider value={ctxValue}>
        {(config.parts.root.render as (c: PartRenderCtx<TRootProps, TCtxExtra, TVariants>) => ReactNode)({
          props: merged,
          getStyles: rootGetStyles,
          ctx: { variant, ...ctxExtras } as TCtxExtra & { variant: TVariants[number] | undefined },
          children: (merged as { children?: ReactNode }).children,
          ref,
        })}
      </CompoundContext.Provider>
    );
  });

  Root.displayName = config.name;
  (Root as any).__vocabularyAxes = config.vocabularyAxes ?? [];

  (Root as any).extend = (
    extendConfig: ComponentExtendConfig<TRootProps>,
  ): ThemeComponentEntry<TRootProps> => ({
    __soribashiThemeEntry: true as const,
    name: config.name,
    vocabulary: extendConfig.vocabulary as any,
    defaultProps: extendConfig.defaultProps ?? {},
    classNames: extendConfig.classNames,
    styles: extendConfig.styles,
    vars: extendConfig.vars,
    attributes: extendConfig.attributes,
  });

  // -------------------------------------------------------------------------
  // Non-root parts
  // -------------------------------------------------------------------------

  const namespacedParts: Record<string, React.ForwardRefExoticComponent<any>> = {};

  for (const [partKey, partConfig] of Object.entries(config.parts)) {
    if (partKey === 'root') continue;

    const partName = `${config.name}${capitalize(partKey)}`;
    const isPolymorphic = (partConfig as PolymorphicPartConfig<any, any>).polymorphic === true;

    if (isPolymorphic) {
      const polyConfig = partConfig as PolymorphicPartConfig<any, any>;

      const PolyPartComponent = forwardRef<unknown, any>(function PolymorphicCompoundPart(rawProps, ref) {
        const rawCtx = useContext(CompoundContext);
        const merged = useProps<any>(partName, polyConfig.defaults ?? null, rawProps);

        const { as: asProp, ...rest } = merged as { as?: keyof JSX.IntrinsicElements; [key: string]: unknown };
        const Element = (asProp ?? polyConfig.defaultElement) as keyof JSX.IntrinsicElements;

        const partGetStyles = (opts?: { part?: string } & GetStylesOptions): GetStylesResult => {
          if (rawCtx === null) {
            throw new Error(`<${config.name}.${capitalize(partKey)}> must be inside <${config.name}>`);
          }
          const targetSlot = opts?.part ?? partKey;
          const isOwnSlot = targetSlot === partKey;
          const m = rest as {
            className?: string;
            style?: CSSProperties;
            classNames?: GetStylesOptions['classNames'];
            styles?: GetStylesOptions['styles'];
            vars?: GetStylesOptions['vars'];
            attributes?: GetStylesOptions['attributes'];
            unstyled?: boolean;
          };
          // Mantine-shaped forwarding (mirrors TabsTab / PopoverDropdown pattern):
          // The part forwards its own styles-API props into ctx.getStyles(slot, options).
          // useStyles is the merge engine — it handles Root-level + part-instance +
          // render-call layers independently; no pre-composition at the part level.
          //
          // className/style scalars only apply to own-slot calls; cross-slot calls
          // use undefined because the scalar refers to this part's root element, not
          // a sibling slot's element. The per-slot record forms (classNames/styles)
          // are self-targeting by slot key and always pass through.
          return rawCtx.getStyles(targetSlot as string, {
            className: isOwnSlot ? (opts?.className ?? m.className) : opts?.className,
            style: isOwnSlot ? (opts?.style ?? m.style) : opts?.style,
            classNames: m.classNames,
            styles: m.styles,
            callClassNames: opts?.classNames,
            callStyles: opts?.styles,
            vars: m.vars,
            attributes: m.attributes,
            unstyled: m.unstyled,
            active: opts?.active,
            variant: opts?.variant,
          });
        };

        const ctxToPass = rawCtx === null
          ? makeNullCtxProxy(config.name, partKey)
          : ({ variant: rawCtx.variant, ...rawCtx.ctxExtras } as TCtxExtra & { variant: TVariants[number] | undefined });

        return (polyConfig.render as (c: any) => ReactNode)({
          Element,
          props: rest,
          getStyles: partGetStyles,
          ctx: ctxToPass as TCtxExtra & { variant: TVariants[number] | undefined },
          children: (rest as { children?: ReactNode }).children,
          ref,
        });
      });

      PolyPartComponent.displayName = partName;

      (PolyPartComponent as any).extend = (
        extendConfig: ComponentExtendConfig<any>,
      ): ThemeComponentEntry<any> => ({
        __soribashiThemeEntry: true as const,
        name: partName,
        vocabulary: extendConfig.vocabulary as any,
        defaultProps: extendConfig.defaultProps ?? {},
        classNames: extendConfig.classNames,
        styles: extendConfig.styles,
        vars: extendConfig.vars,
        attributes: extendConfig.attributes,
      });

      namespacedParts[capitalize(partKey)] = PolyPartComponent;
      continue;
    }

    const PartComponent = forwardRef<unknown, any>(function CompoundPart(rawProps, ref) {
      // Raw context read: null when outside Root (doesn't throw).
      // Passthrough parts (class-3) that never touch ctx or getStyles render fine.
      // Context-consuming parts surface the named error via partGetStyles / ctxToPass.
      const rawCtx = useContext(CompoundContext);

      const merged = useProps<any>(
        partName,
        (partConfig.defaults ?? null) as Partial<any> | null,
        rawProps,
      );

      /**
       * Wraps the Root's getStyles closure with this part's slot as the default,
       * forwarding the part's own styles-API props into the options argument.
       *
       * Mirrors Mantine's TabsTab / PopoverDropdown pattern:
       *   - The part forwards its own classNames/styles/vars/attributes/unstyled
       *     as `options.classNames` / `options.styles` / etc. (part-instance layer).
       *   - Any render-time per-call overrides passed via getStyles({ classNames })
       *     flow as `options.callClassNames` (render-call layer).
       *   - useStyles resolves all three layers independently — no pre-composition
       *     happens at this level.
       *
       * className/style scalars apply only to own-slot calls (cross-slot calls use
       * undefined because the scalar refers to this part's element, not a sibling's).
       * The per-slot record forms are self-targeting by key and always pass through.
       */
      const partGetStyles = (opts?: { part?: string } & GetStylesOptions): GetStylesResult => {
        if (rawCtx === null) {
          throw new Error(
            `<${config.name}.${capitalize(partKey)}> must be inside <${config.name}>`,
          );
        }
        const targetSlot = opts?.part ?? partKey;
        const isOwnSlot = targetSlot === partKey;
        const m = merged as {
          className?: string;
          style?: CSSProperties;
          classNames?: GetStylesOptions['classNames'];
          styles?: GetStylesOptions['styles'];
          vars?: GetStylesOptions['vars'];
          attributes?: GetStylesOptions['attributes'];
          unstyled?: boolean;
        };
        return rawCtx.getStyles(targetSlot as string, {
          className: isOwnSlot ? (opts?.className ?? m.className) : opts?.className,
          style: isOwnSlot ? (opts?.style ?? m.style) : opts?.style,
          classNames: m.classNames,
          styles: m.styles,
          callClassNames: opts?.classNames,
          callStyles: opts?.styles,
          vars: m.vars,
          attributes: m.attributes,
          unstyled: m.unstyled,
          active: opts?.active,
          variant: opts?.variant,
        });
      };

      const ctxToPass = rawCtx === null
        ? makeNullCtxProxy(config.name, partKey)
        : ({ variant: rawCtx.variant, ...rawCtx.ctxExtras } as TCtxExtra & { variant: TVariants[number] | undefined });

      return (partConfig.render as (c: PartRenderCtx<any, TCtxExtra, TVariants>) => ReactNode)({
        props: merged,
        getStyles: partGetStyles,
        ctx: ctxToPass as TCtxExtra & { variant: TVariants[number] | undefined },
        children: (merged as { children?: ReactNode }).children,
        ref,
      });
    });

    PartComponent.displayName = partName;

    (PartComponent as any).extend = (
      extendConfig: ComponentExtendConfig<any>,
    ): ThemeComponentEntry<any> => ({
      __soribashiThemeEntry: true as const,
      name: partName,
      vocabulary: extendConfig.vocabulary as any,
      defaultProps: extendConfig.defaultProps ?? {},
      classNames: extendConfig.classNames,
      styles: extendConfig.styles,
      vars: extendConfig.vars,
      attributes: extendConfig.attributes,
    });

    namespacedParts[capitalize(partKey)] = PartComponent;
  }

  Object.assign(Root as object, namespacedParts);

  return Root as unknown as CompoundComponent<TParts>;
}
