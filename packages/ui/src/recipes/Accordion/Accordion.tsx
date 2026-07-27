import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import type { PartRenderCtx, PolymorphicPartRenderCtx } from '@soribashi/core';
import { createElement, type ElementType, type KeyboardEvent, type Ref } from 'react';
import { defineCompound } from '../../builders.ts';
import classes from './Accordion.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 3 = persistent navigational compound (§ 2.3, Tabs' pattern: parts stay
 * mounted for the lifetime of the compound and switch between an
 * active/inactive state). Accordion is the package's SECOND category-3
 * compound, built on Tabs.tsx's structural template (slot-key const array,
 * per-part `Omit<..., 'render'>`, `stripFrameworkKeys`, `Root` alias). Unlike
 * Tabs, Accordion declares no `variants` tuple and no `vocabularyAxes` at all
 * this slice (a recorded decision, extendable later via the tuple route), so
 * `data-variant`/`data-intent`/`data-size` are all correctly absent under the
 * OR gate in `packages/factory/src/data-attrs.ts` (`hasVariants ||
 * axes.includes('variant')`; both are false here) and there is nothing to
 * strip from the root's rest beyond the Styles API's own framework keys.
 * Read by packages/ui/scripts/derive.ts to build the agent-facing manifest;
 * not itself derived, since it records an authoring decision, not a fact
 * recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 3 as const;

/**
 * The full declared slot set, following the const-array convention Tabs.tsx
 * (and originally Popover.tsx) established: a bare type union is
 * compile-time only, and `defineCompound` cannot recover the real slot set
 * from the parts map alone. Unlike Tabs (whose `indicator` slot has no
 * corresponding public part), Accordion's five slots are exactly its five
 * public parts, one-for-one -- confirmed against the installed
 * `accordion/index.parts.d.ts`, which exports exactly Root/Item/Header/
 * Trigger/Panel and nothing else.
 */
const ACCORDION_SLOT_KEYS = ['root', 'item', 'header', 'trigger', 'panel'] as const;

type AccordionSlotKey = (typeof ACCORDION_SLOT_KEYS)[number];

// No variants tuple this slice (see the recipeCategory comment above), so
// every part's render context is typed with an empty variants tuple, the
// same shape Dialog.tsx (also variant-less) uses for its own `Ctx`.
type Ctx<TProps> = PartRenderCtx<TProps, object, readonly [], AccordionSlotKey>;
type PolyCtx<TProps> = PolymorphicPartRenderCtx<TProps, object, readonly [], AccordionSlotKey>;

/**
 * Base UI's real Accordion surface, enumerated from the installed
 * `packages/ui/node_modules/@base-ui/react/accordion/{index.parts,
 * root/AccordionRoot,root/AccordionRootDataAttributes,item/AccordionItem,
 * item/AccordionItemDataAttributes,item/stateAttributesMapping,
 * header/AccordionHeader,header/AccordionHeaderDataAttributes,
 * trigger/AccordionTrigger,trigger/AccordionTriggerDataAttributes,
 * panel/AccordionPanel,panel/AccordionPanelDataAttributes}.{d.ts,mjs}` at
 * implementation time (the `.mjs` runtime sources too, not just the `.d.ts`
 * files, since two load-bearing facts below are invisible from the types
 * alone), not from memory or another library's accordion API:
 *
 *   - **Value shape: an ARRAY**, always, regardless of `multiple`.
 *     `AccordionValue<Value> = Value[]`; `value`/`defaultValue` is the list
 *     of item values that should be expanded, e.g. `defaultValue={['a']}`.
 *     With the default `multiple={false}`, Root's own `handleValueChange`
 *     still stores a one-element array (or `[]`), never a bare scalar.
 *   - **The multiple-open prop's real name is `multiple`** (boolean, default
 *     `false`), not `openMultiple`. Forwarded straight through by Root's
 *     part below with no recipe-side renaming.
 *   - **Keyboard ownership: Base UI wires NONE of the arrow-key movement
 *     between headers.** `AccordionItem`'s `useCompositeListItem()` only
 *     registers each item's DOM-order INDEX for `data-index`/bookkeeping,
 *     via `CompositeList`, never a `useCompositeRoot`-style roving-tabindex
 *     keydown handler; grepping the entire installed accordion module for
 *     "keydown" turns up nothing. This matches `AccordionRootProps`'
 *     `orientation`/`loopFocus` fields, both explicitly marked `@deprecated`
 *     with the same note: "Deprecated following the APG guidance update
 *     [w3c/aria-practices#3434] to remove roving focus. This state no longer
 *     affects keyboard focus behavior." Base UI's installed version dropped
 *     the pattern entirely; Enter/Space still toggle for free (Trigger is a
 *     real `<button>`, native activation), but ArrowUp/ArrowDown do nothing
 *     without recipe-owned wiring. Global Constraint 2 still requires
 *     arrow-key movement between headers behaviourally, so this recipe owns
 *     the pattern itself (`focusAdjacentTrigger` below) -- the same "Base UI
 *     provided nothing, the recipe owns it" shape Tooltip.tsx's
 *     `aria-describedby` wiring has, not Tabs' (Tabs' `List` gets its
 *     roving-tabindex arrow-key nav for free from Base UI).
 *   - **Stamped open-state attributes, read off the `.mjs` runtime (the
 *     `.d.ts` `*DataAttributes` enums under-document these; each only lists
 *     the "present" half, not the paired "absent" half actually emitted)**:
 *     Item, Header, and Panel all resolve their `open` state through the
 *     SAME shared `collapsibleOpenStateMapping`, which stamps `data-open`
 *     when open and **`data-closed` when closed** (always exactly one, not
 *     "present only when open" as the `.d.ts` comment alone would suggest).
 *     Trigger is different: `triggerOpenStateMapping` stamps
 *     **`data-panel-open`** only while open, with no complementary "closed"
 *     attribute at all. This recipe keys its CSS on Trigger's
 *     `data-panel-open` (Accordion.module.css's `.trigger[data-panel-open]`
 *     rule) since a single presence selector is simplest for the one
 *     stateful cell this recipe needs to key. A second, easy-to-miss finding
 *     from the same runtime read: because Item/Header/Trigger/Panel all
 *     spread the ROOT's own state object (`{...rootState, ...}`) and none of
 *     their custom `stateAttributesMapping`s override the inherited
 *     `orientation` key, **every part -- not just Root -- stamps
 *     `data-orientation`**, identically. That makes `[data-orientation]`
 *     useless as an unambiguous "find the accordion's Root" selector (it
 *     would resolve to the clicked Trigger itself via `Element.closest`'s
 *     own-element check, never climbing to Root); `focusAdjacentTrigger`
 *     below reads a recipe-hand-stamped `data-accordion-root` marker
 *     instead, precisely to route around this.
 *   - **ARIA wiring verdict: Base UI provides the trigger/panel association,
 *     the recipe adds nothing.** `AccordionTrigger` sets `aria-expanded`
 *     unconditionally and `aria-controls` to the panel's id ONLY while open
 *     (`'aria-controls': open ? panelId : undefined` -- a closed, unmounted
 *     panel has no id in the DOM to point at, so an always-on
 *     `aria-controls` would be a dangling IDREF most of the time, the same
 *     failure mode Tooltip.tsx's `aria-describedby` gating avoids).
 *     `AccordionPanel` sets `aria-labelledby` to the trigger's id
 *     unconditionally and `role="region"`, and `AccordionHeader` renders a
 *     real `<h3>` (or whatever `as` overrides it to, via this recipe's own
 *     polymorphism, see the `header` part below) with no extra ARIA
 *     properties needed beyond being a normal heading. Dialog provided
 *     everything for its own ARIA surface; so does Accordion, for the
 *     trigger/panel half -- the one gap (arrow-key movement) is a keyboard
 *     behaviour, not an ARIA attribute.
 */
type RootProps = Omit<BaseAccordion.Root.Props, 'render'>;
type ItemProps = Omit<BaseAccordion.Item.Props, 'render'>;
type HeaderProps = Omit<BaseAccordion.Header.Props, 'render'>;
type TriggerProps = Omit<BaseAccordion.Trigger.Props, 'render'>;
type PanelProps = Omit<BaseAccordion.Panel.Props, 'render'>;

/**
 * Strips the Styles API's own framework keys (consumed internally via
 * getStyles, not valid DOM/Base UI props) plus Base UI's `render` prop
 * (soribashi's compound parts do not expose it publicly). Duplicated
 * verbatim from Tabs.tsx/Dialog.tsx rather than shared, per
 * generate-registry.ts's per-recipe vendoring (each recipe module must stand
 * alone; a consumer installs one recipe's files with no cross-recipe
 * import).
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

/**
 * Recipe-owned roving arrow-key navigation between an accordion's headers:
 * see the Base UI surface comment above ("Keyboard ownership") for why this
 * exists at all -- the installed Base UI Accordion wires none of it.
 *
 * Walks up from the pressed trigger to the nearest `data-accordion-root`
 * marker (hand-stamped by the `root` part below, NOT a Base UI attribute:
 * every real Base UI-stamped attribute on this anatomy, including
 * `data-orientation`, turns out to be stamped on every part alike, per the
 * same comment, so none of them can serve as an unambiguous "this is Root"
 * selector), then collects every trigger button inside it. Every
 * `AccordionTrigger` sets `aria-expanded` unconditionally regardless of open
 * state (confirmed in the same source read), so `button[aria-expanded]` is a
 * stable, Base-UI-guaranteed marker for "every trigger in this accordion",
 * in DOM order, with no extra attribute of our own needed to find them.
 */
function focusAdjacentTrigger(event: KeyboardEvent<HTMLElement>): void {
  const { key } = event;
  if (key !== 'ArrowDown' && key !== 'ArrowUp') return;

  const root = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-accordion-root]');
  if (!root) return;

  const triggers = Array.from(root.querySelectorAll<HTMLElement>('button[aria-expanded]')).filter(
    (el) => !el.hasAttribute('data-disabled'),
  );
  const currentIndex = triggers.indexOf(event.currentTarget as HTMLElement);
  if (currentIndex === -1 || triggers.length === 0) return;

  const delta = key === 'ArrowDown' ? 1 : -1;
  const nextIndex = (currentIndex + delta + triggers.length) % triggers.length;

  if (nextIndex !== currentIndex) {
    event.preventDefault();
    triggers[nextIndex]?.focus();
  }
}

const AccordionCompound = defineCompound({
  name: 'Accordion',
  classes,
  slotKeys: ACCORDION_SLOT_KEYS,
  parts: {
    root: {
      // Unlike Tabs' root (which strips `variant`/`size`/`intent` defensively
      // before spreading `rest` onto the DOM, since Tabs declares a
      // `variants` tuple), Accordion declares no vocabulary axes at all this
      // slice, so `stripFrameworkKeys` is the only stripping needed here --
      // there is no vocabulary-axis prop that could reach `rest` in the
      // first place. `data-accordion-root` is this recipe's own internal
      // traversal marker for `focusAdjacentTrigger` above, not a public
      // styling hook and not a Base UI attribute (see the Base UI surface
      // comment's `data-orientation` finding for why a hand-stamped marker
      // is needed at all).
      render: ({ props, getStyles, ref }: Ctx<RootProps>) => {
        const rest = stripFrameworkKeys(props);
        return (
          <BaseAccordion.Root
            ref={ref as Ref<HTMLDivElement>}
            {...rest}
            {...getStyles()}
            data-accordion-root=""
          />
        );
      },
    },
    item: {
      render: ({ props, getStyles, ref }: Ctx<ItemProps>) => {
        const rest = stripFrameworkKeys(props);
        return <BaseAccordion.Item ref={ref as Ref<HTMLDivElement>} {...rest} {...getStyles()} />;
      },
    },
    header: {
      // Polymorphic so heading level stays composable (Base UI's own Header
      // always renders `<h3>` unless its `render` prop -- which this recipe
      // does not expose publicly -- overrides it): the same "as, resolved
      // internally to Base UI's own render prop" shape Tabs.tsx's `tab` part
      // uses for its own polymorphism.
      polymorphic: true,
      defaultElement: 'h3',
      render: ({ Element, props, getStyles, ref }: PolyCtx<HeaderProps>) => {
        const rest = stripFrameworkKeys(props);
        const isDefaultHeading = Element === 'h3';
        return (
          <BaseAccordion.Header
            ref={ref as Ref<HTMLHeadingElement>}
            render={isDefaultHeading ? undefined : createElement(Element as ElementType)}
            {...rest}
            {...getStyles()}
          />
        );
      },
    },
    trigger: {
      render: ({ props, getStyles, ref }: Ctx<TriggerProps>) => {
        const { onKeyDown: onKeyDownProp, ...withoutOwnHandler } = props;
        const rest = stripFrameworkKeys(withoutOwnHandler);
        return (
          <BaseAccordion.Trigger
            ref={ref as Ref<HTMLButtonElement>}
            onKeyDown={(event) => {
              onKeyDownProp?.(event);
              if (!event.defaultPrevented) focusAdjacentTrigger(event);
            }}
            {...rest}
            {...getStyles()}
          />
        );
      },
    },
    panel: {
      render: ({ props, getStyles, ref }: Ctx<PanelProps>) => {
        const rest = stripFrameworkKeys(props);
        return <BaseAccordion.Panel ref={ref as Ref<HTMLDivElement>} {...rest} {...getStyles()} />;
      },
    },
  },
});

/**
 * defineCompound's root part is designed to be used bare (`<AccordionCompound>`),
 * with `parts.root` deliberately excluded from the dotted namespace (see
 * Tabs.tsx's/Popover.tsx's identical `Root` aliasing note). This recipe's
 * call sites read `Accordion.Root`, `Accordion.Item`, `Accordion.Header`,
 * `Accordion.Trigger`, `Accordion.Panel` uniformly, so `Root` is aliased here
 * to the same component rather than exposed bare.
 */
export const Accordion = Object.assign(AccordionCompound, { Root: AccordionCompound });

export const accordionTheme = Accordion.extend({});
