import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { defineCompound, type PartRenderCtx, type PolymorphicPartRenderCtx } from '@soribashi/core';
import { createElement, type ElementType, type Ref } from 'react';
import classes from './Tabs.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 3 = persistent navigational compound (§ 2.3, Wave 3's Tabs pattern: parts
 * stay mounted for the lifetime of the compound and switch between an
 * active/inactive state, unlike category 2's Popover/Tooltip, where Base UI
 * mounts and unmounts the overlay part entirely). This is the package's
 * first category-3 compound; `defineCompound` is the same builder category
 * 2 uses (see the skill's builder-selection table), so Popover.tsx is this
 * recipe's structural precedent for slot keys, `render`-prop stripping, and
 * part-forwarded styles-API props. Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 3 as const;

/**
 * Tabs' own variant set, declared on the builder's `variants` config tuple
 * (NOT via `Recipe.extend({ vocabulary })`): `defineCompound` only stamps
 * `data-variant` on root when `config.variants.length > 0`
 * (define-compound.tsx), and only reports a non-empty `RecipeMeta.variants`
 * (and therefore a non-empty manifest entry) when this tuple is populated
 * here. The theme's own five-value `variant` vocabulary
 * (filled/outline/subtle/ghost/link) is a colour-intent axis and has no
 * bearing on a tab strip's structural treatment, so it is deliberately not
 * reused; Tabs declares its own three values instead, the same way Alert
 * and Badge declare their own narrower variant tuples.
 */
const TABS_VARIANTS = ['line', 'pill', 'enclosed'] as const;

/**
 * The full declared slot set, following the const-array convention Task 2
 * gave `defineCompound` (see Popover.tsx's identical `POPOVER_SLOT_KEYS`
 * doc comment): a bare type union is compile-time only and neither the
 * parts map nor the CSS module can reconstruct it on their own, since
 * `indicator` is a styled slot with no corresponding public part (the same
 * relationship Popover's `positioner` has to its own parts map). `root`,
 * `list`, `tab`, and `panel` mirror the four public parts one-for-one;
 * `indicator` is the sliding underline `List` composes internally from
 * Base UI's own `Tabs.Indicator` (visible only for `variant="line"`, see
 * Tabs.module.css), the same "one part composes several visual pieces"
 * shape Popover's `content` part has for positioner/popup/arrow.
 */
const TABS_SLOT_KEYS = ['root', 'list', 'tab', 'panel', 'indicator'] as const;

type TabsSlotKey = (typeof TABS_SLOT_KEYS)[number];

type Ctx<TProps> = PartRenderCtx<TProps, object, typeof TABS_VARIANTS, TabsSlotKey>;
type PolyCtx<TProps> = PolymorphicPartRenderCtx<TProps, object, typeof TABS_VARIANTS, TabsSlotKey>;

/**
 * Base UI's real Tabs surface (enumerated from
 * node_modules/@base-ui/react/tabs/{index.parts,root/TabsRoot,list/TabsList,
 * tab/TabsTab,panel/TabsPanel,indicator/TabsIndicator}.d.ts at implementation
 * time, not from memory): `Tabs.Root`/`Tabs.List`/`Tabs.Tab`/`Tabs.Panel`/
 * `Tabs.Indicator`, matching the brief's assumed part names exactly. Two
 * details the brief did not spell out:
 *   - There is no `activationMode` prop. Selection-follows-focus is
 *     `TabsList`'s `activateOnFocus` boolean, default `false` (manual
 *     activation: arrow keys move focus, Enter/Space activates). This
 *     recipe's `List` part defaults it to `true` so arrow-key navigation
 *     activates immediately, the conventional automatic-activation ARIA
 *     tabs pattern Popover's Wave 2 precedent has no equivalent decision
 *     for; a consumer can still opt back into manual activation by passing
 *     `activateOnFocus={false}` explicitly.
 *   - Orientation is `TabsRoot.Orientation` (`'horizontal' | 'vertical'`,
 *     default `'horizontal'`), read off `TabsRootProps.orientation`, exactly
 *     as the brief assumed.
 * `render` is Base UI's own polymorphism mechanism and is stripped at the
 * type level below on every part (Global Constraint 6), the same way
 * Popover.tsx strips it from every Base UI part it wraps.
 */
type RootProps = Omit<BaseTabs.Root.Props, 'render'>;
type ListProps = Omit<BaseTabs.List.Props, 'render'>;
type TabProps = Omit<BaseTabs.Tab.Props, 'render'>;
type PanelProps = Omit<BaseTabs.Panel.Props, 'render'>;

/**
 * Strips the Styles API's own framework keys (consumed internally via
 * getStyles, not valid DOM/Base UI props) plus Base UI's `render` prop
 * (soribashi's compound parts do not expose it publicly). Identical to
 * Popover.tsx's helper of the same name.
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

const TabsCompound = defineCompound({
  name: 'Tabs',
  classes,
  slotKeys: TABS_SLOT_KEYS,
  variants: TABS_VARIANTS,
  vocabularyAxes: ['variant'] as const,
  defaults: { variant: 'line' },
  parts: {
    root: {
      // Unlike Popover's root (a context provider with no DOM of its own),
      // Base UI's TabsRoot renders a real `<div>`, so this part both
      // forwards props to it AND calls getStyles() for its own slot.
      render: ({ props, getStyles, ref }: Ctx<RootProps>) => {
        const rest = stripFrameworkKeys(props);
        return <BaseTabs.Root ref={ref as Ref<HTMLDivElement>} {...rest} {...getStyles()} />;
      },
    },
    list: {
      defaults: { activateOnFocus: true },
      render: ({ props, getStyles, ref }: Ctx<ListProps>) => {
        const { children, ...withoutOwnProps } = props;
        const rest = stripFrameworkKeys(withoutOwnProps);
        return (
          <BaseTabs.List ref={ref as Ref<HTMLDivElement>} {...rest} {...getStyles()}>
            {children}
            {/*
              The sliding underline for variant="line" (hidden via CSS for
              pill/enclosed, see Tabs.module.css's `.indicator` rule).
              Composed here rather than exposed as a public part: consumers
              never place it themselves, the same way Popover's `arrow` has
              no public part of its own and is composed inside `content`.
            */}
            <BaseTabs.Indicator {...getStyles({ part: 'indicator' })} />
          </BaseTabs.List>
        );
      },
    },
    tab: {
      polymorphic: true,
      defaultElement: 'button',
      render: ({ Element, props, getStyles, ref }: PolyCtx<TabProps>) => {
        const rest = stripFrameworkKeys(props);
        const isDefaultButton = Element === 'button';
        return (
          <BaseTabs.Tab
            ref={ref as Ref<HTMLElement>}
            nativeButton={isDefaultButton}
            // Base UI's own polymorphism mechanism: a bare element (no
            // props) is enough, since Base UI clones it and merges in its
            // own generated props (role, aria-selected, aria-controls,
            // event handlers, ...) plus whatever else is in `rest` (e.g.
            // `href` when Element is 'a'), the same "render accepts a
            // ReactElement" contract documented on BaseUIComponentProps.
            render={isDefaultButton ? undefined : createElement(Element as ElementType)}
            {...rest}
            {...getStyles()}
          />
        );
      },
    },
    panel: {
      render: ({ props, getStyles, ref }: Ctx<PanelProps>) => {
        const rest = stripFrameworkKeys(props);
        return <BaseTabs.Panel ref={ref as Ref<HTMLDivElement>} {...rest} {...getStyles()} />;
      },
    },
  },
});

/**
 * defineCompound's root part is designed to be used bare (`<TabsCompound>`),
 * with `parts.root` deliberately excluded from the dotted namespace (see
 * Popover.tsx's identical `Root` aliasing note). This recipe's call sites
 * read `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel` uniformly, so
 * `Root` is aliased here to the same component rather than exposed bare.
 */
export const Tabs = Object.assign(TabsCompound, { Root: TabsCompound });

export const tabsTheme = Tabs.extend({});
