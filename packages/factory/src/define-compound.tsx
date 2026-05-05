import { forwardRef, useContext, type ReactNode, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { createSafeContext } from './create-safe-context.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { GetStylesResult } from './types/render-context.ts';

// ---------------------------------------------------------------------------
// Part render context types
// ---------------------------------------------------------------------------

/**
 * Object passed to each part's `render` function.
 */
interface PartRenderCtx<TProps, TCtxExtra> {
  props: TProps;
  /** Defaults to the part's own slot; pass { part: 'otherSlot' } to target sibling slots. */
  getStyles: (opts?: { part?: string }) => { className: string; style?: React.CSSProperties };
  ctx: TCtxExtra & { variant: string | undefined };
  children?: ReactNode;
  ref: Ref<unknown>;
}

// ---------------------------------------------------------------------------
// Part config types
// ---------------------------------------------------------------------------

interface StandardPartConfig<TProps, TCtxExtra> {
  render: (ctx: PartRenderCtx<TProps, TCtxExtra>) => ReactNode;
  defaults?: Partial<TProps>;
}

interface PolymorphicPartConfig<TProps, TCtxExtra> extends StandardPartConfig<TProps, TCtxExtra> {
  polymorphic: true;
  defaultElement: keyof JSX.IntrinsicElements;
}

type PartConfig<TProps, TCtxExtra> =
  | StandardPartConfig<TProps, TCtxExtra>
  | PolymorphicPartConfig<TProps, TCtxExtra>;

// ---------------------------------------------------------------------------
// Public config type
// ---------------------------------------------------------------------------

export interface DefineCompoundConfig<
  TRootProps extends Record<string, unknown>,
  TParts extends Record<string, PartConfig<any, any>>,
  TVariants extends readonly string[],
  TCtxExtra extends Record<string, unknown> = {},
> {
  name: string;
  variants?: TVariants;
  classes?: Partial<Record<string, string>>;
  defaults?: Partial<TRootProps>;
  vars?: (
    theme: ResolvedTheme,
    props: TRootProps,
  ) => Partial<Record<string, Record<string, string>>>;
  context?: (rootProps: TRootProps) => TCtxExtra;
  parts: TParts & { root: PartConfig<TRootProps, TCtxExtra> };
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

type PartsNamespace<TParts extends Record<string, unknown>> = {
  [K in Exclude<keyof TParts, 'root'> as Capitalize<K & string>]: React.ForwardRefExoticComponent<any> & {
    withDefaults: <P>(defaults: Partial<P>) => ThemeComponentEntry<P>;
    displayName?: string;
  };
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
  TRootProps extends Record<string, unknown>,
  TParts extends Record<string, PartConfig<any, any>>,
  const TVariants extends readonly string[] = readonly [],
  TCtxExtra extends Record<string, unknown> = {},
>(config: DefineCompoundConfig<TRootProps, TParts, TVariants, TCtxExtra>) {
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
      style: (merged as { style?: React.CSSProperties }).style,
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
    const rootGetStyles = (opts?: { part?: string }) =>
      getStylesStr(opts?.part ?? 'root') as { className: string; style?: React.CSSProperties };

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

  (Root as any).withDefaults = <P,>(defaults: Partial<P>): ThemeComponentEntry<P> => ({
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

        const partGetStyles = (opts?: { part?: string }) => {
          if (rawCtx === null) {
            throw new Error(`<${config.name}.${capitalize(partKey)}> must be inside <${config.name}>`);
          }
          return rawCtx.getStyles(opts?.part ?? partKey) as { className: string; style?: React.CSSProperties };
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

      (PolyPartComponent as any).withDefaults = <P,>(defaults: Partial<P>): ThemeComponentEntry<P> => ({
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
      const partGetStyles = (opts?: { part?: string }) => {
        if (rawCtx === null) {
          throw new Error(
            `<${config.name}.${capitalize(partKey)}> must be inside <${config.name}>`,
          );
        }
        return rawCtx.getStyles(opts?.part ?? partKey) as {
          className: string;
          style?: React.CSSProperties;
        };
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

    (PartComponent as any).withDefaults = <P,>(defaults: Partial<P>): ThemeComponentEntry<P> => ({
      __soribashiThemeEntry: true as const,
      name: partName,
      defaultProps: defaults,
    });

    namespacedParts[capitalize(partKey)] = PartComponent;
  }

  Object.assign(Root as object, namespacedParts);

  return Root as unknown as typeof Root & PartsNamespace<TParts> & {
    withDefaults: <P>(defaults: Partial<P>) => ThemeComponentEntry<P>;
  };
}
