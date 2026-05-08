import { forwardRef, useContext, type ComponentPropsWithoutRef, type CSSProperties, type ElementType, type ReactNode, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { createSafeContext } from './create-safe-context.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { GetStylesResult } from './types/render-context.ts';
import type { StylesApiProps, CompoundStylesApiProps } from './types/props.ts';

// ---------------------------------------------------------------------------
// Part render context types
// ---------------------------------------------------------------------------

/**
 * Object passed to each standard part's `render` function.
 */
export interface PartRenderCtx<TProps, TCtxExtra> {
  props: TProps;
  /** Defaults to the part's own slot; pass { part: 'otherSlot' } to target sibling slots. */
  getStyles: (opts?: { part?: string }) => GetStylesResult;
  ctx: TCtxExtra & { variant: string | undefined };
  children?: ReactNode;
  ref: Ref<unknown>;
}

/**
 * Object passed to each polymorphic part's `render` function.
 */
export interface PolymorphicPartRenderCtx<TProps, TCtxExtra> extends PartRenderCtx<TProps, TCtxExtra> {
  Element: keyof JSX.IntrinsicElements;
}

// ---------------------------------------------------------------------------
// Part config types
// ---------------------------------------------------------------------------

export interface StandardPartConfig<TProps, TCtxExtra> {
  render: (ctx: PartRenderCtx<TProps, TCtxExtra>) => ReactNode;
  defaults?: Partial<TProps>;
}

export interface PolymorphicPartConfig<TProps, TCtxExtra> extends StandardPartConfig<TProps, TCtxExtra> {
  polymorphic: true;
  defaultElement: keyof JSX.IntrinsicElements;
}

export type PartConfig<TProps, TCtxExtra> =
  | StandardPartConfig<TProps, TCtxExtra>
  | PolymorphicPartConfig<TProps, TCtxExtra>;

// ---------------------------------------------------------------------------
// Public config type
// ---------------------------------------------------------------------------

/** Extract TProps from a PartConfig<TProps, any>; falls back to Record<string, unknown> for untyped configs */
type ExtractPartProps<C> = C extends PartConfig<infer P, any>
  ? [P] extends [never]
    ? Record<string, unknown>
    : unknown extends P
      ? Record<string, unknown>
      : P
  : Record<string, unknown>;

/** Constrain parts map — each value must be a PartConfig */
type PartsRecord<TCtxExtra extends object> = Record<string, PartConfig<any, TCtxExtra>>;

export interface DefineCompoundConfig<
  TParts extends PartsRecord<TCtxExtra>,
  TVariants extends readonly string[] = readonly [],
  TCtxExtra extends object = object,
> {
  name: string;
  variants?: TVariants;
  classes?: Partial<Record<string, string>>;
  defaults?: Partial<ExtractPartProps<TParts['root']>>;
  vars?: (
    theme: ResolvedTheme,
    props: ExtractPartProps<TParts['root']>,
  ) => Partial<Record<string, Record<string, string>>>;
  context?: (rootProps: ExtractPartProps<TParts['root']>) => TCtxExtra;
  parts: TParts & { root: PartConfig<any, TCtxExtra> };
}

// ---------------------------------------------------------------------------
// Internal context value shape
// ---------------------------------------------------------------------------

interface CompoundContextValue<TCtxExtra> {
  variant: string | undefined;
  /** Widened to string selector so compound internals can pass slot names without TS `never` errors. */
  getStyles: (selector: string) => GetStylesResult;
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
 * For polymorphic parts: extract the default element type and produce the
 * element-attribute intersection (omitting keys already declared by the part's
 * own props). Falls back to `{ as?: ElementType }` for non-polymorphic parts.
 */
type ExtractPartElementAttrs<C> =
  C extends PolymorphicPartConfig<any, any> & { defaultElement: infer D }
    ? D extends keyof JSX.IntrinsicElements
      ? Omit<ComponentPropsWithoutRef<D>, keyof ExtractPartProps<C>> & { as?: ElementType }
      : { as?: ElementType }
    : {};

type PartsNamespace<TParts extends Record<string, PartConfig<any, any>>> = {
  [K in Exclude<keyof TParts, 'root'> as Capitalize<K & string>]: React.ForwardRefExoticComponent<
    ExtractPartProps<TParts[K]>
    & ExtractPartElementAttrs<TParts[K]>
    & CompoundStylesApiProps<PartPayload<TParts[K]>>
    & React.RefAttributes<unknown>
  > & {
    withDefaults: (
      defaults: Partial<ExtractPartProps<TParts[K]>>,
    ) => ThemeComponentEntry<ExtractPartProps<TParts[K]>>;
    displayName?: string;
  };
};

type CompoundComponent<TParts extends Record<string, PartConfig<any, any>>> =
  React.ForwardRefExoticComponent<
    ExtractPartProps<TParts['root']>
    & StylesApiProps<PartPayload<TParts['root']>>
    & React.RefAttributes<unknown>
  > & PartsNamespace<TParts> & {
    withDefaults: (
      defaults: Partial<ExtractPartProps<TParts['root']>>,
    ) => ThemeComponentEntry<ExtractPartProps<TParts['root']>>;
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
  TParts extends PartsRecord<TCtxExtra>,
  const TVariants extends readonly string[] = readonly [],
  TCtxExtra extends object = object,
>(config: DefineCompoundConfig<TParts, TVariants, TCtxExtra>): CompoundComponent<TParts> {
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
  const [CompoundContext] = createSafeContext<CompoundContextValue<TCtxExtra>>(
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

    const variant = (merged as { variant?: string }).variant;
    const ctxExtras = config.context ? config.context(merged) : ({} as TCtxExtra);

    const ctxValue: CompoundContextValue<TCtxExtra> = {
      variant,
      getStyles: getStyles as (selector: string) => GetStylesResult,
      ctxExtras,
    };

    /** Adapts the raw getStyles(selector) into the compound API getStyles({ part? }). */
    const getStylesStr = getStyles as (selector: string) => GetStylesResult;
    const rootGetStyles = (opts?: { part?: string }): GetStylesResult =>
      getStylesStr(opts?.part ?? 'root');

    return (
      <CompoundContext.Provider value={ctxValue}>
        {(config.parts.root.render as (c: PartRenderCtx<TRootProps, TCtxExtra>) => ReactNode)({
          props: merged,
          getStyles: rootGetStyles,
          ctx: { variant, ...ctxExtras } as TCtxExtra & { variant: string | undefined },
          children: (merged as { children?: ReactNode }).children,
          ref,
        })}
      </CompoundContext.Provider>
    );
  });

  Root.displayName = config.name;

  (Root as any).withDefaults = (
    defaults: Partial<TRootProps>,
  ): ThemeComponentEntry<TRootProps> => ({
    __soribashiThemeEntry: true as const,
    name: config.name,
    defaultProps: defaults,
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

        const partGetStyles = (opts?: { part?: string }): GetStylesResult => {
          if (rawCtx === null) {
            throw new Error(`<${config.name}.${capitalize(partKey)}> must be inside <${config.name}>`);
          }
          return rawCtx.getStyles(opts?.part ?? partKey);
        };

        const ctxToPass = rawCtx === null
          ? makeNullCtxProxy(config.name, partKey)
          : ({ variant: rawCtx.variant, ...rawCtx.ctxExtras } as TCtxExtra & { variant: string | undefined });

        return (polyConfig.render as (c: any) => ReactNode)({
          Element,
          props: rest,
          getStyles: partGetStyles,
          ctx: ctxToPass as TCtxExtra & { variant: string | undefined },
          children: (rest as { children?: ReactNode }).children,
          ref,
        });
      });

      PolyPartComponent.displayName = partName;

      (PolyPartComponent as any).withDefaults = (defaults: Partial<any>): ThemeComponentEntry<any> => ({
        __soribashiThemeEntry: true as const,
        name: partName,
        defaultProps: defaults,
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

      /** Wraps the shared getStyles with this part's slot as the default. Throws when outside Root. */
      const partGetStyles = (opts?: { part?: string }): GetStylesResult => {
        if (rawCtx === null) {
          throw new Error(
            `<${config.name}.${capitalize(partKey)}> must be inside <${config.name}>`,
          );
        }
        return rawCtx.getStyles(opts?.part ?? partKey);
      };

      const ctxToPass = rawCtx === null
        ? makeNullCtxProxy(config.name, partKey)
        : ({ variant: rawCtx.variant, ...rawCtx.ctxExtras } as TCtxExtra & { variant: string | undefined });

      return (partConfig.render as (c: PartRenderCtx<any, TCtxExtra>) => ReactNode)({
        props: merged,
        getStyles: partGetStyles,
        ctx: ctxToPass as TCtxExtra & { variant: string | undefined },
        children: (merged as { children?: ReactNode }).children,
        ref,
      });
    });

    PartComponent.displayName = partName;

    (PartComponent as any).withDefaults = (defaults: Partial<any>): ThemeComponentEntry<any> => ({
      __soribashiThemeEntry: true as const,
      name: partName,
      defaultProps: defaults,
    });

    namespacedParts[capitalize(partKey)] = PartComponent;
  }

  Object.assign(Root as object, namespacedParts);

  return Root as unknown as CompoundComponent<TParts>;
}
