import { forwardRef, useContext, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode, type Ref } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import { useProps } from './hooks/use-props.ts';
import { useStyles } from './hooks/use-styles.ts';
import { createSafeContext } from './create-safe-context.ts';
import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { FactoryPayload } from './types/factory-payload.ts';
import type { GetStylesFn, GetStylesOptions, GetStylesResult } from './types/render-context.ts';
import type { StylesApiProps, CompoundStylesApiProps, ClassNames, Styles } from './types/props.ts';

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

export interface PolymorphicPartConfig<TProps, TCtxExtra, TVariants extends readonly string[] = readonly string[]> extends StandardPartConfig<TProps, TCtxExtra, TVariants> {
  polymorphic: true;
  defaultElement: keyof JSX.IntrinsicElements;
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

/** Constrain parts map — each value must be a PartConfig */
type PartsRecord<TCtxExtra extends object, TVariants extends readonly string[] = readonly string[]> = Record<string, PartConfig<any, TCtxExtra, TVariants>>;

export interface DefineCompoundConfig<
  TParts extends PartsRecord<TCtxExtra, TVariants>,
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
  parts: TParts & { root: PartConfig<any, TCtxExtra, TVariants> };
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
 * For polymorphic parts: extract the default element type and produce the
 * element-attribute intersection (omitting keys already declared by the part's
 * own props). Falls back to `{}` for non-polymorphic parts.
 */
type ExtractPartElementAttrs<C> =
  C extends PolymorphicPartConfig<any, any> & { defaultElement: infer D }
    ? D extends keyof JSX.IntrinsicElements
      ? Omit<ComponentPropsWithoutRef<D>, keyof ExtractPartProps<C>> & { as?: keyof JSX.IntrinsicElements }
      : { as?: keyof JSX.IntrinsicElements }
    : {};

type PartsNamespace<TParts extends Record<string, PartConfig<any, any, any>>> = {
  [K in Exclude<keyof TParts, 'root'> as Capitalize<K & string>]: React.ForwardRefExoticComponent<
    ExtractPartProps<TParts[K]>
    & ExtractPartElementAttrs<TParts[K]>
    & CompoundStylesApiProps<PartPayload<TParts[K]>>
    & React.RefAttributes<unknown>
  > & {
    withDefaults: (
      defaults: Partial<ExtractPartProps<TParts[K]> & CompoundStylesApiProps<PartPayload<TParts[K]>>>,
    ) => ThemeComponentEntry<ExtractPartProps<TParts[K]> & CompoundStylesApiProps<PartPayload<TParts[K]>>>;
    displayName?: string;
  };
};

type CompoundComponent<TParts extends Record<string, PartConfig<any, any, any>>> =
  React.ForwardRefExoticComponent<
    ExtractPartProps<TParts['root']>
    & StylesApiProps<PartPayload<TParts['root']>>
    & React.RefAttributes<unknown>
  > & PartsNamespace<TParts> & {
    withDefaults: (
      defaults: Partial<ExtractPartProps<TParts['root']> & StylesApiProps<PartPayload<TParts['root']>>>,
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
// Composition helpers for classNames / styles
// ---------------------------------------------------------------------------

/** Merges two resolved classNames records; per-slot values are space-joined
 * so both classes appear on the element. */
function mergeClassNamesRecord(
  base: Record<string, string | undefined>,
  override: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
  const out: Record<string, string | undefined> = {};
  for (const k of keys) {
    const b = base[k];
    const o = override[k];
    if (b && o) {
      out[k] = `${b} ${o}`;
    } else {
      out[k] = b ?? o;
    }
  }
  return out;
}

/** Merges two resolved styles records; per-slot CSSProperties are shallow-merged,
 * override wins on individual property collisions (consistent with mergeProps semantics). */
function mergeStylesRecord(
  base: Record<string, Record<string, unknown> | undefined>,
  override: Record<string, Record<string, unknown> | undefined>,
): Record<string, Record<string, unknown> | undefined> {
  const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
  const out: Record<string, Record<string, unknown> | undefined> = {};
  for (const k of keys) {
    out[k] = { ...(base[k] ?? {}), ...(override[k] ?? {}) };
  }
  return out;
}

/**
 * Composes two classNames values (record or function form). Both layers apply;
 * per-slot class strings are space-joined so both appear on the element.
 * This avoids the clobber that `override ?? base` would cause when both are present.
 */
function composeClassNames(
  base: ClassNames<any> | undefined,
  override: ClassNames<any> | undefined,
): ClassNames<any> | undefined {
  if (!base) return override;
  if (!override) return base;
  if (typeof base === 'function' || typeof override === 'function') {
    return ((theme: ResolvedTheme, props: unknown) => {
      const baseObj = typeof base === 'function' ? base(theme, props) : base;
      const overrideObj = typeof override === 'function' ? override(theme, props) : override;
      return mergeClassNamesRecord(
        baseObj as Record<string, string | undefined>,
        overrideObj as Record<string, string | undefined>,
      );
    }) as ClassNames<any>;
  }
  return mergeClassNamesRecord(
    base as Record<string, string | undefined>,
    override as Record<string, string | undefined>,
  ) as ClassNames<any>;
}

/**
 * Composes two styles values (record or function form). Both layers apply;
 * per-slot CSSProperties are shallow-merged, override wins per property.
 */
function composeStyles(
  base: Styles<any> | undefined,
  override: Styles<any> | undefined,
): Styles<any> | undefined {
  if (!base) return override;
  if (!override) return base;
  if (typeof base === 'function' || typeof override === 'function') {
    return ((theme: ResolvedTheme, props: unknown) => {
      const baseObj = typeof base === 'function' ? base(theme, props) : base;
      const overrideObj = typeof override === 'function' ? override(theme, props) : override;
      return mergeStylesRecord(
        baseObj as Record<string, Record<string, unknown> | undefined>,
        overrideObj as Record<string, Record<string, unknown> | undefined>,
      );
    }) as Styles<any>;
  }
  return mergeStylesRecord(
    base as Record<string, Record<string, unknown> | undefined>,
    override as Record<string, Record<string, unknown> | undefined>,
  ) as Styles<any>;
}

// ---------------------------------------------------------------------------
// defineCompound
// ---------------------------------------------------------------------------

export function defineCompound<
  TParts extends PartsRecord<TCtxExtra, TVariants>,
  const TVariants extends readonly string[] = readonly [],
  TCtxExtra extends object = object,
  TClasses extends Partial<Record<string, string>> = Partial<Record<string, string>>,
>(config: DefineCompoundConfig<TParts, TVariants, TCtxExtra> & { classes?: TClasses }): CompoundComponent<TParts> {
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

        const partGetStyles = (opts?: { part?: string } & GetStylesOptions): GetStylesResult => {
          if (rawCtx === null) {
            throw new Error(`<${config.name}.${capitalize(partKey)}> must be inside <${config.name}>`);
          }
          const targetSlot = opts?.part ?? partKey;
          const isOwnSlot = targetSlot === partKey;
          const m = rest as {
            className?: string;
            style?: CSSProperties;
            classNames?: unknown;
            styles?: unknown;
            vars?: unknown;
          };
          return rawCtx.getStyles(
            targetSlot as string,
            {
              // className/style: only from merged when targeting OWN slot;
              // for cross-slot, only opts-provided overrides apply
              className: opts?.className ?? (isOwnSlot ? m.className : undefined),
              style: opts?.style ?? (isOwnSlot ? m.style : undefined),
              // classNames/styles: COMPOSE instance-level and per-call layers so
              // both apply (per-call wins on key collisions). Using ?? would silently
              // drop the instance layer whenever a per-call override is supplied.
              classNames: composeClassNames(
                m.classNames as ClassNames<any> | undefined,
                opts?.classNames as ClassNames<any> | undefined,
              ) as GetStylesOptions['classNames'],
              styles: composeStyles(
                m.styles as Styles<any> | undefined,
                opts?.styles as Styles<any> | undefined,
              ) as GetStylesOptions['styles'],
              active: opts?.active,
              variant: opts?.variant,
            },
          );
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

      /**
       * Wraps the shared getStyles with this part's slot as the default.
       * Forwards instance-level styles-API props (className, style,
       * classNames, styles) from the part's merged props so they are
       * actually applied at runtime. Per-call opts override merged props.
       *
       * className/style are only forwarded from merged when the call targets
       * THIS part's own slot. Cross-slot calls (e.g. Content rendering the
       * arrow slot) must not leak the part-instance className/style onto
       * sibling slots. The per-slot classNames/styles maps still apply since
       * those are keyed by slot name internally.
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
          classNames?: unknown;
          styles?: unknown;
          vars?: unknown;
        };
        return rawCtx.getStyles(
          targetSlot as string,
          {
            // className/style: only from merged when targeting OWN slot;
            // for cross-slot, only opts-provided overrides apply
            className: opts?.className ?? (isOwnSlot ? m.className : undefined),
            style: opts?.style ?? (isOwnSlot ? m.style : undefined),
            // classNames/styles: COMPOSE instance-level and per-call layers so
            // both apply (per-call wins on key collisions). Using ?? would silently
            // drop the instance layer whenever a per-call override is supplied.
            classNames: composeClassNames(
              m.classNames as ClassNames<any> | undefined,
              opts?.classNames as ClassNames<any> | undefined,
            ) as GetStylesOptions['classNames'],
            styles: composeStyles(
              m.styles as Styles<any> | undefined,
              opts?.styles as Styles<any> | undefined,
            ) as GetStylesOptions['styles'],
            active: opts?.active,
            variant: opts?.variant,
          },
        );
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
