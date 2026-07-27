import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import type { ReactNode, Ref } from 'react';
import { useContext, useId } from 'react';
import { defineComponent } from '../../builders.ts';
import { Field, FieldAnatomyContext } from '../Field/Field.tsx';
import { type RadioGroupAccessors, resolveRadioGroupItems } from './items.ts';
import classes from './RadioGroup.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.5). RadioGroup follows Select's own category-4
 * precedent for its DATA SHAPE only: a flat, data-driven `items` prop with
 * `getLabel`/`getValue` accessors, not a public compound of individually
 * authored children (there is no `RadioGroup.Item`). The precedent does NOT
 * extend to Select's builder: the slice 4 spec's roster locks `RadioGroup |
 * 4 | defineComponent` as a reviewed decision, and this recipe's public
 * surface is not generic over an arbitrary caller item type the way
 * `Select<T>` is. The accepted trade: `items` is typed over the fixed
 * `RadioGroupItem` shape (`{ label, value, description? }`, values always
 * strings, matching a native radio's own value semantics), not a
 * caller-supplied generic `T`. `getLabel`/`getValue` still let a caller
 * reshape which property of THAT fixed item type supplies the label/value,
 * but cannot widen the item shape itself the way Select's genuine generic
 * could. `items.ts`'s own resolver (`resolveRadioGroupItems<T>`) stays fully
 * generic for its own node-tier tests; only this recipe's public prop
 * surface fixes `T = RadioGroupItem`.
 *
 * `defineComponent` (imported from `'../../builders.ts'`, this package's own
 * `makeBuilders<typeof uiTheme>()` wrapper -- see `create-builders.ts` and
 * `themed-builders.ts`'s `ThemedDefineComponent`) also gives
 * `vocabularyAxes: ['size', 'intent']` real, theme-narrowed literal
 * injection for free (`InjectedVocabularyProps` intersected with
 * `ThemedVocabularyProps<uiVocabulary, TVocabAxes>`), which
 * `defineGenericComponent` cannot provide at all (`ThemedDefineGenericComponent`
 * has no such narrowing hook; confirmed by reading `themed-builders.ts`
 * directly). A hand-declared `size`/`intent` union, the way this file
 * originally carried before this conversion, can silently drift from the
 * theme's own vocabulary with no compiler check tying the two together --
 * exactly the substitution this slice's Checkbox recipe hit (also drafted
 * against `defineGenericComponent` from the category description alone) and
 * reverted for the identical reason. Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
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
  BaseRadioGroup.Props<string>,
  'render' | 'className' | 'style' | 'children' | 'value' | 'defaultValue' | 'onValueChange'
>;

/**
 * The fixed item shape this recipe's public surface commits to (the accepted
 * trade for `defineComponent` over `defineGenericComponent`, per the module
 * doc comment above). `value: string`, not `unknown`: a radio's value is
 * always a string at the DOM level (Base UI's hidden `<input type="radio"
 * value={...}>` serializes it that way regardless), so fixing the type to
 * `string` costs nothing real while making `RadioGroupProps`'s
 * `value`/`defaultValue`/`onValueChange` concretely typed instead of
 * `unknown`. `getLabel`/`getValue` (via `RadioGroupAccessors<RadioGroupItem>`
 * below) let a caller supply a differently-shaped object that still narrows
 * to this interface structurally (extra properties are fine; `label`/`value`
 * must still be present), or override which value each resolves to; they
 * cannot accept a caller item type with NO `label`/`value` fields at all,
 * which is exactly the ergonomic cost this recipe's task report flagged and
 * the controller accepted.
 */
export interface RadioGroupItem {
  label: string;
  value: string;
  description?: ReactNode;
}

/**
 * Slots, following the const-array convention (Popover.tsx/Field.tsx):
 * `defineComponent` reports this array as `RecipeMeta.slots` verbatim. All
 * ten actually render somewhere (none trimmed): `root`/`label`/`description`/
 * `error` only in anatomy mode (the same known bare-mode limitation
 * TextInput/Switch document -- no `root` element in bare mode, so
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

/**
 * `size`/`intent` are NOT declared on this interface: `vocabularyAxes: ['size',
 * 'intent']` on the builder call below injects them, theme-narrowed to
 * `uiVocabulary`'s own literal unions via `InjectedVocabularyProps` +
 * `ThemedVocabularyProps` (see the module doc comment), the same way
 * Checkbox.tsx's/Switch.tsx's own `CheckboxProps`/`SwitchProps` leave both
 * axes off their own interfaces.
 *
 * No explicit `StylesApiProps<...>`/`UniversalStyleProps` extension here
 * either (fix-wave Minor rider, collapsed to match Switch.tsx's identical
 * standalone-interface shape): `defineComponent`'s own
 * `DefineComponentPublicProps` already intersects both onto the public prop
 * type automatically, keyed off the config's own `selectors` tuple below --
 * a recipe-level `RadioGroupPayload`/explicit extension was dead weight
 * duplicating that composition, not a requirement of declaring
 * `RadioGroupProps` as a standalone interface.
 */
export interface RadioGroupProps extends RootProps, RadioGroupAccessors<RadioGroupItem> {
  /** The raw item data, fixed to `RadioGroupItem`'s shape. Resolved via `getLabel`/`getValue` (items.ts); `description` is read directly, never accessor-driven. */
  items: readonly RadioGroupItem[];
  /**
   * Fix round 1, Important finding: overrides the inherited
   * `RadioGroupAccessors<RadioGroupItem>` member (items.ts's own
   * `getValue?: (item: T) => unknown`, correctly generic there for the
   * standalone resolver's own reuse) with a narrower, `string`-returning
   * signature on THIS recipe's public surface. Without this override,
   * `<RadioGroup getValue={() => 42} />` type-checked cleanly even though
   * `value`/`defaultValue` are fixed to `string` and the render body casts
   * `resolvedItem.value as string` at the `Radio.Root` callsite -- a
   * non-string return would silently break the checked-value comparison at
   * runtime with no compile-time or runtime warning. A narrower return type
   * is a legal interface-member override (function return positions are
   * covariant, and `string` is assignable wherever the base member's
   * `unknown` was expected). This is a compile-time constraint only:
   * `resolveRadioGroupItems` itself still types the resolved value as
   * `unknown` (items.ts's own generic contract, unchanged), so the render
   * body's existing `as string` cast at `Radio.Root value={...}` stays in
   * place regardless.
   */
  getValue?: (item: RadioGroupItem) => string;
  /** The value of the currently selected item, or `undefined`. Controlled form. */
  value?: string;
  /** The value the group is initially rendered with. Uncontrolled form. */
  defaultValue?: string;
  /** Called with the resolved value (never the raw item) of the newly selected radio. */
  onValueChange?: BaseRadioGroup.Props<string>['onValueChange'];
  /** Field label, rendered via `Field.Label` when present. See the module doc comment. */
  label?: ReactNode;
  /** Field description/hint, rendered via `Field.Description` when present. */
  description?: ReactNode;
  /** Field error, rendered via `Field.Error` (forced-visible) when present. */
  error?: ReactNode;
}

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
 * `defineComponent` calls `config.render(...)` as a plain, unconditional,
 * synchronous function call from a fixed point in its own render body,
 * functionally identical to inlining the hook calls there.
 */
export const RadioGroup = defineComponent<
  RadioGroupProps,
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
    } = props as RadioGroupProps & Record<string, unknown>;

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
                value={resolvedItem.value as string}
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
