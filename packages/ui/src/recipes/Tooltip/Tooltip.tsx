import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { PartRenderCtx } from '@soribashi/core';
import { type ReactNode, type Ref, useId } from 'react';
import { defineCompound } from '../../builders.ts';
import classes from './Tooltip.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 2 = transient overlay compound (§ 2.2). Tooltip is the pattern that
 * section was originally written from (the pilot code is gone; Popover.tsx
 * is this slice's living precedent instead, converted first). Read by
 * packages/ui/scripts/derive.ts to build the agent-facing manifest; not
 * itself derived, since it records an authoring decision, not a fact
 * recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 2 as const;

/**
 * The full declared slot set. Declared as a const array rather than a bare
 * type union so `defineCompound` can report it as RecipeMeta.slots: the
 * union alone is compile-time only, and neither the parts map nor the CSS
 * module can reconstruct it (`positioner` is neither a part nor a styled
 * class). `root` and `trigger` have no rules in Tooltip.module.css today
 * (Base UI owns their box model), but getStyles() still wires them so a
 * future `tooltipTheme.extend({ classNames })` can target them. Unlike
 * Popover, there is no `title`/`description`/`close` sub-part: a tooltip's
 * content is plain children, not composed anatomy.
 */
const TOOLTIP_SLOT_KEYS = ['root', 'trigger', 'positioner', 'popup', 'arrow'] as const;

type TooltipSlotKey = (typeof TOOLTIP_SLOT_KEYS)[number];

/**
 * `contentId` is computed once per `Tooltip.Root` instance (via `useId()`
 * in `context` below) and threaded to every part through `ctx`. It is what
 * lets the Trigger part and the Content part agree on a shared id without
 * either one knowing about the other: see the accessibility-wiring comment
 * on the trigger/content parts below for why this id has to exist at all.
 */
interface TooltipCtxExtra {
  contentId: string;
}

type Ctx<TProps> = PartRenderCtx<TProps, TooltipCtxExtra, readonly [], TooltipSlotKey>;

type RootProps = BaseTooltip.Root.Props;

// `render` is Base UI's own polymorphism mechanism (see Popover.tsx's
// identical note): every part-prop alias below omits it so it is a type
// error at the call site, not just stripped at runtime.
type TriggerProps = Omit<BaseTooltip.Trigger.Props, 'render'>;

/**
 * Content composes Portal + Positioner + Popup + Arrow into a single public
 * part, the same shape as Popover.tsx's `ContentProps`. `container` forwards
 * to the Portal: load-bearing for the same reason Popover's is (Tasks
 * 10/11's re-anchoring tests) -- a default-portalled popup renders under
 * `<body>`, escaping any `.tenant-*`/`.dark` scoped-theme wrapper. Everything
 * else in `rest` forwards to the Positioner (side/align/sideOffset/...);
 * `children` render inside the Popup.
 */
type ContentProps = Omit<BaseTooltip.Positioner.Props, 'children' | 'render'> & {
  container?: BaseTooltip.Portal.Props['container'];
  children?: ReactNode;
};

/**
 * Strips the Styles API's own framework keys (consumed internally via
 * getStyles, not valid DOM/Base UI props) plus Base UI's `render` prop
 * (soribashi's compound parts do not expose it publicly). Identical to
 * Popover.tsx's helper of the same name; duplicated rather than shared
 * because each recipe module is meant to stand alone (see
 * generate-registry.ts's per-recipe vendoring, which copies one recipe's
 * files verbatim into a consumer project with no cross-recipe import).
 */
function stripFrameworkKeys<
  T extends Partial<
    Record<'classNames' | 'styles' | 'vars' | 'attributes' | 'unstyled' | 'render', unknown>
  >,
>(props: T): Omit<T, 'classNames' | 'styles' | 'vars' | 'attributes' | 'unstyled' | 'render'> {
  const {
    classNames: _classNames,
    styles: _styles,
    vars: _vars,
    attributes: _attributes,
    unstyled: _unstyled,
    render: _render,
    ...rest
  } = props;
  return rest;
}

const TooltipCompound = defineCompound({
  name: 'Tooltip',
  classes,
  slotKeys: TOOLTIP_SLOT_KEYS,
  /**
   * `useId()` inside this callback is legal for the same reason
   * RadioGroup.tsx's/TextInput.tsx's doc comments give for their own
   * `render`-body hook calls: `defineCompound`'s Root component calls
   * `config.context(...)` as a plain, unconditional, synchronous function
   * call from a fixed point in its own render body (define-compound.tsx),
   * functionally identical to inlining the hook call there. The ternary
   * that guards the call (`config.context ? config.context(...) : {}`)
   * is a per-call-site constant -- this recipe always declares `context`,
   * Popover never does -- not a value that can vary between renders of the
   * same component instance, so React's rules of hooks hold.
   */
  context: () => ({ contentId: useId() }),
  parts: {
    root: {
      // No DOM of its own: Base UI's Root is a context provider, so there is
      // no element to attach getStyles('root') or a ref to.
      render: ({ props }: Ctx<RootProps>) => <BaseTooltip.Root {...props} />,
    },
    trigger: {
      render: ({ props, getStyles, ref, ctx }: Ctx<TriggerProps>) => {
        const rest = stripFrameworkKeys(props);
        // Empirically verified against the installed @base-ui/react/tooltip
        // (task report's Base UI Tooltip findings): unlike Popover's
        // Title/Description, Base UI's TooltipTrigger wires NEITHER
        // `aria-describedby` NOR `aria-labelledby` to the popup by design --
        // its own docs (docs/react/components/tooltip.md, "Accessibility"
        // section) instead tell consumers to put a redundant `aria-label` on
        // the trigger. That leaves a tooltip's visible content with no
        // programmatic association to its trigger at all unless something
        // wires it. This recipe wires the standard WAI-ARIA tooltip pattern
        // itself (https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/):
        // `aria-describedby` points at the same `contentId` the content part
        // below stamps onto the Popup as `id` + `role="tooltip"`.
        //
        // Fix round 1 finding: an EARLIER version of this set `aria-describedby`
        // unconditionally. The Popup has no `keepMounted` (default false, see
        // Popover.tsx's identical default), so it is removed from the DOM
        // entirely while closed -- an unconditional `aria-describedby` would
        // reference a NON-EXISTENT id for the whole closed lifetime of the
        // tooltip, which is most of the time. IDREF attributes must reference
        // an existing element; the WAI-ARIA tooltip pattern gates the
        // association on open state for exactly this reason. Gating it here
        // needs the tooltip's LIVE open state, which is NOT available from
        // `context` (defineCompound calls `config.context(rootProps)` with
        // the ROOT's incoming props, not Base UI's own internal store state;
        // an uncontrolled `defaultOpen` tooltip's live open/closed transitions
        // never appear in `rootProps`). Reached instead via Base UI's own
        // `render` prop used as an internal implementation detail (typed and
        // public on `BaseUIComponentProps`, see internals/types.d.ts's
        // `ComponentRenderFn<RenderFunctionProps, State>`; NOT re-exposed on
        // this recipe's own `TriggerProps`, which still omits `render` and is
        // still stripped from any caller-supplied props above): Base UI calls
        // `render(mergedProps, state)` when `render` is a function
        // (internals/useRenderElement.js's `evaluateRenderProp`), and
        // `TooltipTriggerState.open` is the SAME `isOpenedByThisTrigger`
        // selector that drives the `data-popup-open` attribute Base UI already
        // stamps on this element by default -- the authoritative source of
        // truth for "is this trigger's tooltip currently open", not a
        // hand-rolled mirror via wrapping `onOpenChange` that could drift out
        // of sync with Base UI's own internal transitions (disabled-while-open,
        // another tooltip stealing a delay-group's instant-open slot, etc.).
        // `type="button"` is set explicitly because a custom `render` function
        // bypasses `useRenderElement.js`'s own `renderTag` default (confirmed
        // by reading it): the DEFAULT (no custom `render`) path is the only
        // place that default lives.
        return (
          <BaseTooltip.Trigger
            ref={ref as Ref<HTMLButtonElement>}
            {...rest}
            {...getStyles()}
            render={(triggerProps, state) => (
              <button
                type="button"
                {...triggerProps}
                aria-describedby={state.open ? ctx.contentId : undefined}
              />
            )}
          />
        );
      },
    },
    content: {
      render: ({ props, getStyles, ref, ctx }: Ctx<ContentProps>) => {
        const {
          children,
          container,
          className: _className,
          style: _style,
          ...withoutOwnProps
        } = props;
        const rest = stripFrameworkKeys(withoutOwnProps);
        return (
          <BaseTooltip.Portal container={container}>
            <BaseTooltip.Positioner sideOffset={8} {...rest} {...getStyles({ part: 'positioner' })}>
              <BaseTooltip.Popup
                id={ctx.contentId}
                role="tooltip"
                ref={ref as Ref<HTMLDivElement>}
                {...getStyles({ part: 'popup' })}
              >
                <BaseTooltip.Arrow {...getStyles({ part: 'arrow' })} />
                {children}
              </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
          </BaseTooltip.Portal>
        );
      },
    },
  },
});

/**
 * defineCompound's root part is designed to be used bare (`<TooltipCompound>`,
 * see define-compound.test.tsx's Cycle 7.1; identical to Popover.tsx's own
 * alias). This recipe's call sites are meant to read `Tooltip.Root`,
 * `Tooltip.Trigger`, `Tooltip.Content` uniformly, so `Root` is aliased here
 * to the same component rather than exposed bare.
 */
export const Tooltip = Object.assign(TooltipCompound, { Root: TooltipCompound });

export const tooltipTheme = Tooltip.extend({});
