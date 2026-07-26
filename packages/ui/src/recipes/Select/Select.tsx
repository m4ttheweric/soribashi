import { Select as BaseSelect } from '@base-ui/react/select';
import type { StylesApiProps, UniversalStyleProps } from '@soribashi/core';
import type { ReactElement, ReactNode, Ref } from 'react';
import { defineGenericComponent } from '../../builders.ts';
import type { uiVocabulary } from '../../theme.ts';
import { type ResolvedSelectItem, resolveSelectItems, type SelectAccessors } from './items.ts';
import classes from './Select.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.4). Unlike Checkbox (also category 4, but a
 * fixed-shape control with no real generic type inference, so it correctly
 * uses `defineComponent`), Select genuinely needs to type-check against a
 * caller-supplied item type `T`: `<Select items={users} getLabel={(u) =>
 * u.name} .../>` must type `getLabel`'s parameter as `User`, not `any`. That
 * is exactly what `defineGenericComponent` exists for (see its own doc
 * comment: "components like Select<TItem>, ComboBox<TOption>, ..."), and
 * this recipe is the package's only real consumer of it today. Read by
 * packages/ui/scripts/derive.ts to build the agent-facing manifest; not
 * itself derived, since it records an authoring decision, not a fact
 * recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 4 as const;

/**
 * Base UI's real select surface, enumerated from
 * node_modules/@base-ui/react/select/{root,trigger,value,icon,portal,
 * positioner,popup,list,item,item-text,item-indicator,group,group-label}/*.d.ts
 * at implementation time (not from memory), per the skill's requirement for
 * category-4 recipes:
 *
 * - `Select.Root<Value, Multiple>` is a context provider (no DOM of its own),
 *   generic over the selected VALUE type and an optional `multiple` flag. It
 *   does accept its own `items`/`itemToStringLabel`/`itemToStringValue` props
 *   for simple `{label, value}`-shaped or `Record<string, ReactNode>` data,
 *   but that shape can't carry a caller's own accessor functions or grouping,
 *   so this recipe renders `Select.Item`/`Select.Group` explicitly from
 *   `items.ts`'s resolution instead of handing raw `items` to Root.
 * - `Select.Trigger` renders a real `<button>`.
 * - `Select.Value` renders the selected item's label (or `placeholder`) as a
 *   `<span>`; it accepts a render-prop `children` function, unused here.
 * - `Select.Icon` is a decorative `<span>` indicating the trigger opens a
 *   popup.
 * - `Select.Portal` / `Select.Positioner` / `Select.Popup` / `Select.List`
 *   mirror Popover's Portal/Positioner/Popup/(no List) structure; `Portal`'s
 *   `container` prop is the same escape hatch Popover.tsx's `Content`
 *   forwards, needed for the identical reason (a default-portalled popup
 *   renders under `<body>`, escaping any `.tenant-*`/`.dark` scoped wrapper).
 * - `Select.Item` renders a `<div role="option">`; it takes its own `value`
 *   and an optional `label` (used for keyboard typeahead matching, defaults
 *   to the item's text content).
 * - `Select.ItemText` / `Select.ItemIndicator` are the item's label and
 *   selected-checkmark slots.
 * - `Select.Group` / `Select.GroupLabel` group related items with an
 *   associated label, exactly matching this recipe's `getGroup` accessor.
 *
 * `render` is Base UI's own polymorphism mechanism and is not exposed
 * publicly on any part here (stripped at the type level below, the same
 * convention Popover.tsx and Checkbox.tsx follow for every Base UI part they
 * wrap); `defineGenericComponent` does not strip it for you.
 */
type RootValue = unknown;
type RootProps = BaseSelect.Root.Props<RootValue, false>;

/**
 * `size` is hand-declared here, narrowed directly against the ui theme's own
 * `size` vocabulary, rather than composed in via a shared "InjectedVocabularyProps"
 * helper the way defineComponent/definePolymorphicComponent/defineCompound do
 * automatically. `defineGenericComponent`'s public type comes ENTIRELY from
 * the author-supplied `TSignature` (see define-generic-component.tsx's doc
 * comment and packages/factory/src/types/themed-builders.ts's
 * `ThemedDefineGenericComponent`, whose return type is bare `TSignature &
 * GenericComponentStatics<TSignature>` with no vocabulary narrowing hook at
 * all, unlike the other three themed builder types): there is no framework
 * mechanism that would inject or narrow this for a generic component, so a
 * category-4 recipe that wants a themed vocabulary prop on its public type
 * writes that prop, and its literal union, itself. `@soribashi/ui` doing so
 * here (reading `uiVocabulary.size.values` directly) is exactly the "ui
 * package is a consumer, allowed to take a vocabulary position" carve-out
 * CLAUDE.md's invariant 2 describes, not a framework-level vocabulary
 * decision.
 */
export type SelectSize = (typeof uiVocabulary.size.values)[number];

const SELECT_SELECTORS = [
  // `root` maps to Base UI's `Select.Root`, a context provider with no DOM
  // of its own (the same shape as Popover's `root` slot; see Popover.tsx's
  // POPOVER_SLOT_KEYS comment and Popover.test.tsx's "Root has no DOM of its
  // own" case). Listed here for RecipeMeta/`Select.extend()` parity even
  // though `render` below never calls `getStyles('root')`: style props
  // (`m`, `p`, ...) are still accepted and extracted by the builder, just
  // inert, by design, since there is no element to attach them to.
  'root',
  'trigger',
  'icon',
  'positioner',
  'popup',
  'list',
  'group',
  'groupLabel',
  'item',
  'itemText',
  'itemIndicator',
] as const;

type SelectSelectorName = (typeof SELECT_SELECTORS)[number];

/**
 * The `FactoryPayload` shape `StylesApiProps` needs to type `classNames`/
 * `styles`/`vars`/`attributes` against this recipe's own selector union,
 * mirroring what `defineComponent`/`definePolymorphicComponent` compose in
 * automatically via their own `TExtra`/render-ctx machinery. Generic
 * components get none of that for free (see `SelectSignature`'s doc comment
 * above), so it is spelled out here instead.
 */
interface SelectPayload {
  props: Record<string, unknown>;
  stylesNames: SelectSelectorName;
}

export interface SelectProps<T>
  extends Omit<
      RootProps,
      'render' | 'children' | 'value' | 'defaultValue' | 'onValueChange' | 'items'
    >,
    SelectAccessors<T>,
    StylesApiProps<SelectPayload>,
    UniversalStyleProps {
  /** The raw item data. Resolved via `getLabel`/`getValue`/`getGroup` (items.ts). */
  items: readonly T[];
  /** The resolved value of the currently selected item, or `null`. Controlled form. */
  value?: RootValue | null;
  /** The resolved value the select is initially rendered with. Uncontrolled form. */
  defaultValue?: RootValue | null;
  /** Called with the resolved value (never the raw item) of the newly selected item. */
  onValueChange?: RootProps['onValueChange'];
  /** Shown in the trigger when no item is selected. */
  placeholder?: ReactNode;
  /**
   * Forwards to Base UI's `Select.Portal`. Load-bearing the same way
   * Popover.tsx's `Content.container` is: a default-portalled popup renders
   * under `<body>`, escaping any `.tenant-*`/`.dark` scoped-theme wrapper, so
   * a consumer inside a scoped subtree must be able to re-anchor the portal
   * there to get the scoped theme's tokens instead of the default theme's.
   */
  container?: BaseSelect.Portal.Props['container'];
  /** Themed size (trigger height, popup item density). */
  size?: SelectSize;
}

/**
 * The author-supplied generic call signature `defineGenericComponent`'s
 * `TSignature` type parameter preserves through `withProps` (see its own doc
 * comment). This is the ENTIRE public type of `Select`: forgetting to pass
 * this explicitly as `defineGenericComponent`'s first type argument (leaving
 * it to default to `GenericComponentFn`, whose `props` is `any`) would
 * silently drop every prop's typing, not just `size` -- see
 * Select.test.tsx's `_typeCheckSelectSignature` for the compile-time pin
 * against exactly that regression.
 */
export type SelectSignature = <T>(
  props: SelectProps<T> & { ref?: Ref<HTMLButtonElement> },
) => ReactElement | null;

/**
 * Trigger heights keyed on the ui theme's size vocabulary, following the
 * dimension-record pattern (Button's BUTTON_HEIGHTS, Checkbox's
 * CHECKBOX_SIZES). Lives in the recipe, not the framework (CLAUDE.md
 * invariant 2).
 */
const SELECT_TRIGGER_HEIGHTS: Record<string, string> = {
  xs: '1.75rem',
  sm: '2rem',
  md: '2.25rem',
  lg: '2.5rem',
  xl: '2.75rem',
};

interface SelectRenderProps extends Record<string, unknown> {
  items: readonly unknown[];
  getLabel?: (item: unknown) => string;
  getValue?: (item: unknown) => unknown;
  getGroup?: (item: unknown) => string | undefined;
  value?: RootValue | null;
  defaultValue?: RootValue | null;
  onValueChange?: RootProps['onValueChange'];
  placeholder?: ReactNode;
  container?: BaseSelect.Portal.Props['container'];
  size?: SelectSize;
}

/**
 * `defineGenericComponent`'s generic-params trap (see the authoring skill):
 * ALL FOUR of this builder's own type parameters (`TSignature, TSelectors,
 * TVariants, TVocabAxes`, read off define-generic-component.tsx's source,
 * NOT defineComponent's four-param list, which is a different shape) are
 * spelled out explicitly below rather than left to inference.
 */
export const Select = defineGenericComponent<
  SelectSignature,
  typeof SELECT_SELECTORS,
  readonly [],
  readonly ['size']
>({
  name: 'Select',
  vocabularyAxes: ['size'] as const,
  selectors: SELECT_SELECTORS,
  classes,
  defaults: { size: 'md' },
  vars: (_theme, props) => {
    const p = props as { size?: string };
    const height = SELECT_TRIGGER_HEIGHTS[p.size ?? 'md'] ?? SELECT_TRIGGER_HEIGHTS.md!;
    return {
      trigger: { '--sb-select-trigger-height': height },
    };
  },
  render: ({ props, getStyles, ref }) => {
    const {
      items,
      getLabel,
      getValue,
      getGroup,
      value,
      defaultValue,
      onValueChange,
      placeholder,
      container,
      size: _size,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rootRest
    } = props as SelectRenderProps;

    const { flat, groups } = resolveSelectItems(items, { getLabel, getValue, getGroup });
    const labelByValue = new Map(flat.map((resolved) => [resolved.value, resolved.label]));

    const renderItem = (resolved: ResolvedSelectItem<unknown>) => (
      <BaseSelect.Item
        key={String(resolved.value)}
        value={resolved.value}
        label={resolved.label}
        {...getStyles('item')}
      >
        <BaseSelect.ItemIndicator {...getStyles('itemIndicator')}>✓</BaseSelect.ItemIndicator>
        <BaseSelect.ItemText {...getStyles('itemText')}>{resolved.label}</BaseSelect.ItemText>
      </BaseSelect.Item>
    );

    return (
      <BaseSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        {...(rootRest as Omit<RootProps, 'value' | 'defaultValue' | 'onValueChange'>)}
      >
        <BaseSelect.Trigger ref={ref as Ref<HTMLButtonElement>} {...getStyles('trigger')}>
          {/*
            A children function is required to show the resolved item's
            LABEL rather than its raw value: `Select.Value` only knows how
            to derive a label on its own from Base UI Root's own `items`
            prop (a `{label,value}[]`/`Record`/`Group[]` shape this recipe
            deliberately does not hand to Root, see the surface-enumeration
            comment above), which this recipe bypasses in favor of its own
            accessor-driven `items.ts` resolution. Passing a function bypasses
            Value's own placeholder handling entirely (confirmed against
            SelectValue.js: a function `children` is always invoked, even
            with no value selected), so the placeholder is handled here too.
          */}
          <BaseSelect.Value>
            {(v: unknown) => (v == null ? placeholder : (labelByValue.get(v) ?? String(v)))}
          </BaseSelect.Value>
          <BaseSelect.Icon {...getStyles('icon')} aria-hidden="true">
            ▾
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal container={container}>
          <BaseSelect.Positioner sideOffset={4} {...getStyles('positioner')}>
            <BaseSelect.Popup {...getStyles('popup')}>
              <BaseSelect.List {...getStyles('list')}>
                {groups
                  ? groups.map((group) => (
                      <BaseSelect.Group key={group.group} {...getStyles('group')}>
                        <BaseSelect.GroupLabel {...getStyles('groupLabel')}>
                          {group.group}
                        </BaseSelect.GroupLabel>
                        {group.items.map(renderItem)}
                      </BaseSelect.Group>
                    ))
                  : flat.map(renderItem)}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    );
  },
});

export const selectTheme = Select.extend({});
