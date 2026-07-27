import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import type { StylesApiProps, UniversalStyleProps } from '@soribashi/core';
import type { ReactElement, ReactNode, Ref } from 'react';
import { useContext, useId } from 'react';
import { defineGenericComponent } from '../../builders.ts';
import type { uiVocabulary } from '../../theme.ts';
import { Field, FieldAnatomyContext } from '../Field/Field.tsx';
import { type RadioGroupAccessors, resolveRadioGroupItems } from './items.ts';
import classes from './RadioGroup.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.4). RadioGroup follows Select's own category-4
 * precedent (§ 2.4's title is simply "Form control"; Select and Checkbox both
 * classify here despite one needing generic inference and the other not): a
 * flat, data-driven `items` prop with `getLabel`/`getValue` accessors over a
 * caller-supplied item type `T`, not a public compound of individually
 * authored children (there is no `RadioGroup.Item`). Because the accessors
 * genuinely need to type-check against `T` (`<RadioGroup items={plans}
 * getLabel={(p) => p.name} .../>` must type `p` as `Plan`, not `any`), this
 * recipe uses `defineGenericComponent`, the same builder Select uses and for
 * the same reason (see Select.tsx's own doc comment); Checkbox, which needs
 * no item-type generic, correctly stays on `defineComponent` instead. Read by
 * packages/ui/scripts/derive.ts to build the agent-facing manifest; not
 * itself derived, since it records an authoring decision, not a fact
 * recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 4 as const;

/**
 * Base UI's real radio-group surface, enumerated from
 * node_modules/@base-ui/react/{radio-group/{RadioGroup,RadioGroupDataAttributes}.d.ts,
 * radio/{index.parts,root/RadioRoot,indicator/RadioIndicator}.d.ts}.d.ts PLUS
 * the compiled `.js` sources (`RadioGroup.js`, `radio/root/RadioRoot.js`,
 * `field/label/FieldLabel.js`, `internals/labelable-provider/{LabelableProvider,
 * useLabel,useAriaLabelledBy,useLabelableId}.js`) at implementation time, not
 * from memory -- the `.d.ts` files alone do not answer the group-label
 * question below, the same way Switch.tsx's own doc comment found for its
 * label-association question.
 *
 * - `RadioGroup` (aliased `BaseRadioGroup` here) is a single component, a
 *   context provider that renders one real `<div role="radiogroup">` (NOT a
 *   compound of a root part plus separate item parts the way Select's
 *   Root/Item/Group are). `Radio.Root`/`Radio.Indicator` are the per-item
 *   parts, read off `radio/index.parts.d.ts`.
 * - Prop names match the brief's assumption: `value`/`defaultValue`/
 *   `onValueChange` on `RadioGroup`, plus `disabled`/`readOnly`/`required`/
 *   `name`/`form`/`inputRef`. No axis-prop collision: `RadioGroupProps`
 *   extends `BaseUIComponentProps<'div', ...>`, and a `<div>` has no native
 *   `size` HTML attribute the way TextInput's native `<input size>` did, so
 *   neither `size` nor `intent` needs an `Omit` here (Switch.tsx's own doc
 *   comment reaches the identical conclusion for its `<span>` root).
 * - `Radio.Root` takes a required `value` (identifies it within the group)
 *   plus `disabled`/`required`/`readOnly`/`inputRef`; it renders a `<span
 *   role="radio">` alongside a hidden `<input type="radio">` sibling, exactly
 *   mirroring Switch's/Checkbox's own hidden-input shape. Keyboard ownership:
 *   confirmed from `RadioRoot.js` that when nested inside a `RadioGroup`,
 *   each `Radio.Root`'s visible span renders through Base UI's internal
 *   `CompositeItem` (not a bare element), which is what implements roving
 *   tabindex and arrow-key focus movement; `RadioGroup.js`'s own
 *   `onKeyDownCapture` marks the group `touched`/`focused` on any Arrow key,
 *   and each `Radio.Root`'s `onFocus` handler calls `inputRef.current.click()`
 *   whenever `touched` is true -- so arrow-key navigation both moves DOM
 *   focus (Composite's own job) AND flips the selection (this per-item
 *   focus-triggers-click wiring), which is exactly what
 *   RadioGroup.test.tsx's "moves selection with arrow keys" case observes
 *   and asserts on both axes.
 * - `Radio.Indicator` defaults to `keepMounted: false` (identical default to
 *   `Checkbox.Indicator`): it mounts into the DOM only while its own radio is
 *   checked. No extra prop is set here to change that default, the same way
 *   Checkbox.tsx leaves it alone.
 *
 * Group-label association (the brief's Step-1 question, answered by reading
 * `RadioGroup.js`/`FieldLabel.js`/`useLabel.js`/`LabelableProvider.js`
 * together): Base UI's `RadioGroup` renders a `<div role="radiogroup">`, and
 * a `<label>` cannot be natively associated with a `<div>` (a `<div>` is not
 * a "labelable element" per the HTML spec) the way `Field.Label`'s
 * `nativeLabel` default association works for TextInput's real `<input>` or
 * Switch's hidden `<input type="checkbox">`. Reading the actual mechanism
 * settles this without guessing: `Field.Root`'s `LabelableProvider` holds one
 * shared `labelId`, set when `Field.Label` mounts (`useLabel({ native: true
 * })` registers its own rendered `id` as `labelId` via `syncLabelId`).
 * `RadioGroup.js` reads that SAME ambient `labelId` directly
 * (`useLabelableContext()`) and sets it as `aria-labelledby` on its own
 * `role="radiogroup"` div (`ariaLabelledby = elementProps['aria-labelledby']
 * ?? labelId ?? fieldsetContext?.legendId`) -- entirely independent of
 * `Field.Label`'s own rendered `<label>` tag or its `htmlFor`. Separately,
 * `Field.Label`'s own `nativeLabel: true` default DOES still render a real
 * `<label>` element (so no `nativeLabel={false}` dev warning fires, since the
 * rendered tag is always `<label>` regardless), but its `htmlFor` resolves to
 * `undefined`: `useLabelableId`'s `registerControlId` is called only by
 * `Checkbox.Root` in this codebase's dependency tree (confirmed by grepping
 * every compiled `.js` for `registerControlId` callers), and `RadioGroup`
 * never calls it, so `LabelableContext`'s `controlId` stays unset and
 * `FieldLabel.js`'s `htmlFor={resolvedControlId ?? undefined}` renders no
 * `for` attribute at all -- avoiding exactly the invalid-HTML outcome (a
 * native label pointing at a non-labelable div) `FieldLabel.d.ts`'s
 * `nativeLabel` doc comment warns about, with NO extra prop needed on
 * `Field.Label` here. So the default (`Field.Label` used exactly as
 * TextInput/Switch already use it, no `nativeLabel` override) is correct:
 * the group's accessible name comes entirely through the `aria-labelledby`
 * wiring, proven by `RadioGroup.test.tsx`'s
 * `getByRole('radiogroup', { name: 'Plan' })` resolving.
 *
 * Per-item label association is a SEPARATE finding this ambient wiring makes
 * necessary, not optional: `RadioRoot.js` shows each `Radio.Root` ALSO reads
 * the same ambient `labelId` (`useLabelableContext()` again, this time inside
 * `useAriaLabelledBy(ariaLabelledByProp, labelId, ...)`, whose priority order
 * is `explicit ?? labelId ?? fallback`). Left alone, every item's radio would
 * inherit the GROUP's own label ("Plan") as its accessible name instead of
 * its own item label ("Free"/"Pro"), since `labelId` is truthy and wins
 * before any native-label fallback lookup runs. This recipe closes that gap
 * by passing an explicit `aria-labelledby` on every `Radio.Root`, pointing at
 * that item's own label `<span>` (`explicitAriaLabelledBy` then wins
 * unconditionally) -- proven by this file's per-item `getByRole('radio',
 * { name: 'Free' })` queries actually resolving to the right accessible name,
 * not the group's.
 *
 * `Field.Item` (`field/item/FieldItem.d.ts`, new in Base UI 1.6.0) was read
 * and is deliberately NOT used, for either the group label or per-item
 * description wiring: its compiled source (`FieldItem.js`) shows it opens a
 * NEW `LabelableProvider` scope keyed off `useCheckboxGroupContext()`
 * specifically -- it has no radio-group-equivalent context read at all, so it
 * would register no `controlId` for a `Radio.Root` and would not produce
 * correct per-item association here; it is CheckboxGroup-shaped machinery,
 * not RadioGroup-shaped, as of this pinned version. Per-item description
 * association is hand-rolled instead (a generated id on each item's own
 * description `<span>`, passed as `aria-describedby` on that item's
 * `Radio.Root`): `RadioRoot.js`'s own prop-merge order (`[rootProps,
 * elementProps, getButtonProps, getDescriptionProps, ...]`, and
 * `mergeProps`'s rightmost-wins-except-event-handlers semantics, read from
 * `merge-props/mergeProps.js`) means this explicit `aria-describedby` lands
 * in `elementProps` BEFORE `getDescriptionProps` (a props-getter function,
 * `LabelableProvider.js`) runs; that getter reads whatever `aria-describedby`
 * is already present and APPENDS the Field-level `messageIds` (this
 * recipe's own group-level `description`/`error`, when present) on top,
 * space-separated and deduped -- so an item ends up described by BOTH its
 * own item description AND the shared field-level hint/error, composing
 * correctly with no extra wiring needed for the latter.
 *
 * `render` is Base UI's own polymorphism mechanism and is stripped at the
 * type level below, the same convention every other Base-UI-backed recipe in
 * this package follows.
 */
type RootProps = Omit<
  BaseRadioGroup.Props<unknown>,
  'render' | 'className' | 'style' | 'children' | 'value' | 'defaultValue' | 'onValueChange'
>;

/**
 * `size`/`intent` are hand-declared here, narrowed directly against the ui
 * theme's own vocabularies, the same way Select.tsx's `SelectSize` is: per
 * Select.tsx's own doc comment, `defineGenericComponent`'s public type comes
 * ENTIRELY from the author-supplied `TSignature`, with no automatic
 * `InjectedVocabularyProps` composition the way `defineComponent`/
 * `definePolymorphicComponent`/`defineCompound` provide. `@soribashi/ui`
 * doing so here is the same "ui package is a consumer, allowed to take a
 * vocabulary position" carve-out CLAUDE.md's invariant 2 describes.
 */
export type RadioGroupSize = (typeof uiVocabulary.size.values)[number];
export type RadioGroupIntent = (typeof uiVocabulary.intent.values)[number];

/**
 * Slots, following the const-array convention (Popover.tsx/Field.tsx):
 * `defineGenericComponent` reports this array as `RecipeMeta.slots` verbatim.
 * All ten actually render somewhere (none trimmed): `root`/`label`/
 * `description`/`error` only in anatomy mode (the same known bare-mode
 * limitation TextInput/Switch document -- no `root` element in bare mode, so
 * `data-size`/`data-intent` never land there either); `group`/`item`/
 * `control`/`indicator`/`itemLabel` always; `itemDescription` only for an
 * item that actually supplies a `description`, which is still a real,
 * reachable render path, not dead code.
 */
const RADIOGROUP_SELECTORS = [
  'root',
  'label',
  'description',
  'error',
  'group',
  'item',
  'control',
  'indicator',
  'itemLabel',
  'itemDescription',
] as const;
type RadioGroupSelectorName = (typeof RADIOGROUP_SELECTORS)[number];

/**
 * The `FactoryPayload` shape `StylesApiProps` needs to type `classNames`/
 * `styles`/`vars`/`attributes` against this recipe's own selector union, the
 * same `SelectPayload` shape Select.tsx spells out for the identical reason
 * (generic components get none of this composed in automatically).
 */
interface RadioGroupPayload {
  props: Record<string, unknown>;
  stylesNames: RadioGroupSelectorName;
}

export interface RadioGroupProps<T>
  extends RootProps,
    RadioGroupAccessors<T>,
    StylesApiProps<RadioGroupPayload>,
    UniversalStyleProps {
  /** The raw item data. Resolved via `getLabel`/`getValue` (items.ts); `description` is read directly, never accessor-driven. */
  items: readonly T[];
  /** The resolved value of the currently selected item, or `undefined`. Controlled form. */
  value?: unknown;
  /** The resolved value the group is initially rendered with. Uncontrolled form. */
  defaultValue?: unknown;
  /** Called with the resolved value (never the raw item) of the newly selected radio. */
  onValueChange?: BaseRadioGroup.Props<unknown>['onValueChange'];
  /** Field label, rendered via `Field.Label` when present. See the module doc comment. */
  label?: ReactNode;
  /** Field description/hint, rendered via `Field.Description` when present. */
  description?: ReactNode;
  /** Field error, rendered via `Field.Error` (forced-visible) when present. */
  error?: ReactNode;
  /** Themed size (control dimensions). */
  size?: RadioGroupSize;
  /** Themed intent (checked colour). */
  intent?: RadioGroupIntent;
}

/**
 * The author-supplied generic call signature `defineGenericComponent`'s
 * `TSignature` type parameter preserves through `withProps` (Select.tsx's own
 * `SelectSignature` doc comment explains the mechanism this mirrors exactly).
 * Forgetting to pass this explicitly (leaving `TSignature` to default to
 * `GenericComponentFn`, whose `props` is `any`) would silently drop every
 * prop's typing, not just `size`/`intent` -- see this file's own
 * `_typeCheckRadioGroupSignature` (bottom of RadioGroup.test.tsx) for the
 * compile-time pin against exactly that regression.
 */
export type RadioGroupSignature = <T>(
  props: RadioGroupProps<T> & { ref?: Ref<HTMLDivElement> },
) => ReactElement | null;

/**
 * Control dimensions keyed on the ui theme's size vocabulary, following the
 * dimension-record pattern (Checkbox's CHECKBOX_SIZES, Switch's
 * SWITCH_HEIGHTS). Lives in the recipe, not the framework (CLAUDE.md
 * invariant 2). Carries the all-lowercase `--sb-radiogroup-size` custom
 * property RadioGroup.module.css's `.control` rule consumes, per the task
 * brief.
 */
const RADIOGROUP_SIZES: Record<string, string> = {
  xs: '0.875rem',
  sm: '1rem',
  md: '1.125rem',
  lg: '1.25rem',
  xl: '1.375rem',
};

interface RadioGroupRenderProps extends Record<string, unknown> {
  items: readonly unknown[];
  getLabel?: (item: unknown) => string;
  getValue?: (item: unknown) => unknown;
  value?: unknown;
  defaultValue?: unknown;
  onValueChange?: BaseRadioGroup.Props<unknown>['onValueChange'];
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  size?: RadioGroupSize;
  intent?: RadioGroupIntent;
}

/**
 * The selected item's visible mark, drawn as an inline SVG dot filled with
 * `currentColor` rather than a CSS `background-color` on the indicator
 * `<span>` itself -- the same mechanism Switch.tsx's `ThumbDot` uses, and for
 * the same structural reason: it keeps `Radio.Indicator`'s own
 * `background-color` genuinely transparent (RadioGroup.module.css's
 * `.indicator` rule sets none), so the contrast matrix's small-coverage cell
 * can point its `backdropClass` at the sibling `.control` element that
 * actually paints the checked fill, per the task brief's note recording
 * Task 7's review finding. `color`/`--sb-radiogroup-checked-color` (set on
 * `.control`, inherited by this child since custom properties inherit by
 * default) drives the fill via `currentColor`.
 */
function RadioDot() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: '50%', height: '50%' }}
    >
      <circle cx="6" cy="6" r="6" />
    </svg>
  );
}

/**
 * The composed-mode contract, the same shape TextInput/Switch establish (see
 * TextInput.tsx's doc comment for the authoritative copy), with one
 * divergence the task brief calls out explicitly: anatomy mode's `Field.Root`
 * does NOT get `data-layout="row"` here. The group stacks vertically like
 * TextInput's own column anatomy (RadioGroup.module.css's `.group` rule is
 * what arranges the flat item list; the per-ITEM control+label pairing is a
 * row, via `.item`, entirely independent of Field's row/column choice).
 *
 * - Bare mode (no `label`/`description`/`error`): renders ONLY the group
 *   (`BaseRadioGroup` and its `Radio.Root`/`Radio.Indicator` items), no
 *   `Field.Root` wrapper. Same known bare-mode limitation TextInput/Switch
 *   document: no `root` element, so `data-size`/`data-intent` never land in
 *   bare mode -- sizing/colour still ride `--sb-radiogroup-size`/
 *   `--sb-radiogroup-checked-bg` regardless.
 * - Anatomy mode renders `Field.Root`/`Field.Label`/the group/
 *   `Field.Description`/`Field.Error` in that order, matching Field.test.tsx's
 *   own composition order (label before control).
 * - Convenience props and hand-composed Field are mutually exclusive:
 *   RadioGroup warns (dev-only, message names "RadioGroup") rather than
 *   silently doing something different, and does NOT suppress its own
 *   internal `Field.Root` in that case, the same pinned behaviour
 *   TextInput.test.tsx/Switch.test.tsx establish for their own recipes.
 *
 * `useContext(FieldAnatomyContext)`/`useId()` inside this `render` function
 * body are legal for the same reason TextInput.tsx's doc comment gives:
 * `defineGenericComponent` calls `config.render(...)` as a plain,
 * unconditional, synchronous function call from a fixed point in its own
 * render body (confirmed by reading `generic-component.tsx`'s
 * `defineGenericComponent`, the same call shape `defineComponent` uses),
 * functionally identical to inlining the hook calls there.
 */
export const RadioGroup = defineGenericComponent<
  RadioGroupSignature,
  typeof RADIOGROUP_SELECTORS,
  readonly [],
  readonly ['size', 'intent']
>({
  name: 'RadioGroup',
  vocabularyAxes: ['size', 'intent'] as const,
  selectors: RADIOGROUP_SELECTORS,
  classes,
  defaults: { size: 'md', intent: 'primary' },
  // RadioGroup declares no variants, so autoVars (which needs both `intent`
  // AND `variant` to produce anything) would return {} here regardless; a
  // custom resolver is required to derive the checked colours from intent at
  // all. `theme.intentResolver` is called directly with a fixed
  // `variant: 'filled'` (a selected radio's fill is always solid, the same
  // fixed-variant call Checkbox.tsx's/Switch.tsx's own resolvers make), just
  // without a `variant` prop on this recipe to read it from.
  vars: (theme, props) => {
    const p = props as { size?: string; intent?: string };
    const size = RADIOGROUP_SIZES[p.size ?? 'md'] ?? RADIOGROUP_SIZES.md!;
    const resolved = theme.intentResolver({
      intent: p.intent ?? 'primary',
      variant: 'filled',
      theme,
    });
    return {
      control: {
        '--sb-radiogroup-size': size,
        '--sb-radiogroup-checked-bg': resolved.background,
        '--sb-radiogroup-checked-color': resolved.color,
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    // Vocabulary axis props (size/intent) are NOT stripped by the builder
    // before render and getStyles('control') already emits data-size/
    // data-intent there in anatomy mode's getStyles('root') call (the same
    // bare-mode limitation TextInput/Switch note), so both are destructured
    // out here rather than spread onto the DOM. items/getLabel/getValue/
    // label/description/error are this recipe's own convenience props,
    // consumed below rather than forwarded to the group. classNames/styles/
    // vars/attributes/unstyled are the Styles API's own config surface, not
    // valid DOM/Base-UI props, and are stripped the same way every other
    // recipe in this package strips them.
    const {
      items,
      getLabel,
      getValue,
      value,
      defaultValue,
      onValueChange,
      label,
      description,
      error,
      size: _size,
      intent: _intent,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...groupRest
    } = props as RadioGroupRenderProps;

    const hasAnatomy = label != null || description != null || error != null;
    const inAncestorField = useContext(FieldAnatomyContext);
    if (process.env.NODE_ENV !== 'production' && hasAnatomy && inAncestorField) {
      console.warn(
        '[soribashi] RadioGroup received label/description/error inside a hand-composed ' +
          'Field.Root. The two are mutually exclusive: use the bare group inside Field.Root ' +
          'and compose Field.Label/Field.Description/Field.Error yourself.',
      );
    }

    const resolved = resolveRadioGroupItems(items, { getLabel, getValue });
    // One stable base id per mount, suffixed per item below: gives each
    // item's own label/description `<span>` a unique id to be pointed at by
    // that item's `Radio.Root` via explicit `aria-labelledby`/
    // `aria-describedby` (see the module doc comment's per-item-association
    // finding -- the ambient group `labelId` would otherwise leak onto every
    // item).
    const baseId = useId();

    const group = (
      <BaseRadioGroup
        ref={ref as Ref<HTMLDivElement>}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        {...(groupRest as Omit<RootProps, 'value' | 'defaultValue' | 'onValueChange'>)}
        {...getStyles('group')}
      >
        {resolved.map((resolvedItem, index) => {
          const itemLabelId = `${baseId}-label-${index}`;
          const itemDescriptionId =
            resolvedItem.description != null ? `${baseId}-description-${index}` : undefined;
          return (
            // biome-ignore lint/a11y/noLabelWithoutControl: the association IS real, just invisible to this static check. Base UI's Radio.Root (an opaque custom component from biome's perspective) renders a hidden native <input type="radio"> as a descendant of this <label>; RadioGroup.test.tsx's "selects when an item label text is clicked" case proves the association at runtime.
            <label key={String(resolvedItem.value)} {...getStyles('item')}>
              <Radio.Root
                value={resolvedItem.value}
                aria-labelledby={itemLabelId}
                aria-describedby={itemDescriptionId}
                {...getStyles('control')}
              >
                <Radio.Indicator {...getStyles('indicator')}>
                  <RadioDot />
                </Radio.Indicator>
              </Radio.Root>
              <span id={itemLabelId} {...getStyles('itemLabel')}>
                {resolvedItem.label}
              </span>
              {resolvedItem.description != null ? (
                <span id={itemDescriptionId} {...getStyles('itemDescription')}>
                  {resolvedItem.description as ReactNode}
                </span>
              ) : null}
            </label>
          );
        })}
      </BaseRadioGroup>
    );
    if (!hasAnatomy) return group;

    return (
      <Field.Root invalid={error != null} {...getStyles('root')}>
        {label != null ? <Field.Label {...getStyles('label')}>{label}</Field.Label> : null}
        {group}
        {description != null ? (
          <Field.Description {...getStyles('description')}>{description}</Field.Description>
        ) : null}
        {error != null ? (
          <Field.Error match {...getStyles('error')}>
            {error}
          </Field.Error>
        ) : null}
      </Field.Root>
    );
  },
});

export const radioGroupTheme = RadioGroup.extend({});
