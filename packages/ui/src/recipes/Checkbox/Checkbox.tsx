import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import type { ReactNode, Ref } from 'react';
import { useContext } from 'react';
import { defineComponent } from '../../builders.ts';
import { Field, FieldAnatomyContext } from '../Field/Field.tsx';
import classes from './Checkbox.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.5). Checkbox is a single `defineComponent`
 * with four slots, per the spec's locked decision: it needs no real generic
 * type inference over an item type the way Select<TItem> eventually will,
 * so `defineComponent` (Alert's own builder, and the one the spec/plan/brief
 * all name) handles its fixed prop interface, multi-slot styling, and
 * `vocabularyAxes` injection directly, the same shape Alert.tsx already
 * proves out. Read by packages/ui/scripts/derive.ts to build the
 * agent-facing manifest; not itself derived, since it records an authoring
 * decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 4 as const;

/**
 * Control dimensions keyed on the ui theme's size vocabulary, following the
 * dimension-record pattern (Badge's BADGE_HEIGHTS, Button's BUTTON_HEIGHTS).
 * Lives in the recipe, not the framework, because @soribashi/ui is a
 * consumer and owns these values (CLAUDE.md invariant 2). Carries the
 * `--sb-checkbox-size` custom property the registry smoke's bundle-marker
 * assertion looks for (see Checkbox.module.css's `.control` rule).
 */
const CHECKBOX_SIZES: Record<string, string> = {
  xs: '0.875rem',
  sm: '1rem',
  md: '1.125rem',
  lg: '1.25rem',
  xl: '1.375rem',
};

/**
 * Base UI's real checkbox surface (enumerated from
 * node_modules/@base-ui/react/checkbox/{index.parts,root/CheckboxRoot,indicator/CheckboxIndicator}.d.ts
 * at implementation time, not from memory): `Checkbox.Root` renders a
 * `<span role="checkbox">` alongside a visually-hidden native
 * `<input type="checkbox">` sibling; `Checkbox.Indicator` renders a `<span>`
 * that mounts only while `checked || indeterminate` (default
 * `keepMounted: false`). There is no separate `Checkbox.Label`/`Checkbox`
 * part; Root's props are `checked`/`defaultChecked`/`onCheckedChange`/
 * `disabled`/`readOnly`/`required`/`indeterminate`/`name`/`value`/
 * `uncheckedValue`/`form`/`id`/`inputRef`/`parent` (grouped-checkbox use,
 * unused here) plus the generic Base UI `render`/`className`/`style`
 * surface. `render` is Base UI's own polymorphism mechanism and is stripped
 * at the type level below (`defineComponent` does not strip it for you,
 * same as every other Base-UI-backed recipe), the way Popover.tsx strips it
 * from every Base UI part it wraps.
 */
export interface CheckboxProps
  extends Omit<BaseCheckbox.Root.Props, 'render' | 'className' | 'style' | 'children'> {
  /**
   * Label text/content rendered beside the control. The locked
   * compatibility decision of the Field-anatomy migration: when `label` is
   * the ONLY anatomy present, it renders inside the same `<label>` element
   * the control mounts into -- real label association (native
   * label-wraps-control semantics), not proximity: the hidden native input
   * Base UI's Root renders is a descendant of this `<label>`, so clicking
   * the label text dispatches a click at that input the same way a native
   * `<label><input type="checkbox">Text</label>` would. When `description`
   * or `error` is also present (Field anatomy mode), the label renders
   * through `Field.Label` instead, the way Switch's always does; the
   * association is then Base UI Field's own `<label for>` wiring, equally
   * real. Known consequence of that locked decision: a label-ONLY Checkbox
   * nested inside a hand-composed `Field.Root` renders its own containment
   * `<label>` alongside the consumer's `Field.Label` -- two competing
   * labels, with no dev warning, because only `description`/`error` (the
   * Field-anatomy triggers) arm the mutual-exclusivity warning.
   */
  label?: ReactNode;
  /**
   * Field description/hint, rendered via `Field.Description` when present.
   * Its presence (or `error`'s) is what switches the recipe into
   * `Field.Root` anatomy mode; see the render doc comment.
   */
  description?: ReactNode;
  /**
   * Field error, rendered via `Field.Error` (forced-visible) when present.
   * Its presence (or `description`'s) is what switches the recipe into
   * `Field.Root` anatomy mode; see the render doc comment.
   */
  error?: ReactNode;
}

/**
 * Centred in the 12x12 viewBox. The original path ('M3.5 7.5 6 10l6-7')
 * spanned x 3.5..12 (centre 7.75, not 6) and y 3..10 (centre 6.5, not 6):
 * the glyph itself sat off-centre inside its own SVG bounds, so however
 * perfectly flex centred the SVG element in the control, the painted check
 * rendered visibly right-and-down of centre at every size. This is the same
 * class of defect as RadioGroup's half-pixel dot and Switch's padding-box
 * thumb (STATUS.md design-ledger record): the fix moves the geometry, it
 * does not nudge the container. This path is the original translated by
 * (-1.75, -0.5) -- identical shape, bounds x 1.75..10.25 and y 2.5..9.5,
 * both centred on 6. Round stroke caps extend symmetrically, so geometric
 * centring is painted centring. Pinned by Checkbox.test.tsx's
 * symmetric-gaps measurement at every size.
 */
const CHECK_PATH = 'M1.75 7 4.25 9.5l6-7';
// A horizontal bar, not the checked glyph: indeterminate ("some selected")
// must read differently from checked ("all selected") to a sighted user.
// The ARIA (`aria-checked="mixed"`) already distinguishes the two states for
// assistive tech; this closes the same gap visually. Drawn the same way as
// CheckMark (an inline SVG path stroked with `currentColor`) rather than
// introducing a second indicator mechanism.
const DASH_PATH = 'M2.5 6h7';

function CheckMark() {
  return (
    <svg
      className={classes.check}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: '70%', height: '70%' }}
    >
      <path d={CHECK_PATH} />
    </svg>
  );
}

function DashMark() {
  return (
    <svg
      className={classes.dash}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: '70%', height: '70%' }}
    >
      <path d={DASH_PATH} />
    </svg>
  );
}

/**
 * `size`/`intent` are injected by `vocabularyAxes: ['size', 'intent']`
 * rather than declared on `CheckboxProps` directly (vocabulary axis props
 * come from the builder, not the recipe's own prop type): `defineComponent`
 * composes `InjectedVocabularyProps<TVocabAxes>` into the public type for
 * free, the same mechanism Alert/Badge get. That type is bare `string` for
 * both axes today, same as theirs (see the authoring skill's "known
 * limitation" section): the literal-union narrowing only exists behind
 * `makeBuilders<TTheme>()`/`createSoribashiBuilders(theme)`, which no recipe
 * in this package calls. Select's hand-declared `SelectSize`, not this
 * mechanism, is the only narrowed `size` in the package. Checkbox declares
 * NO variant axis: a checkbox has exactly one visual treatment per
 * intent/size, so there is nothing for a `variant` tuple to select between.
 * All four generic params are supplied explicitly (TOwnProps, TSelectors,
 * TVariants, TVocabAxes) for readability; it makes no difference to
 * narrowing either way.
 */
export const Checkbox = defineComponent<
  CheckboxProps,
  readonly ['root', 'control', 'indicator', 'label', 'description', 'error'],
  readonly [],
  readonly ['size', 'intent']
>({
  name: 'Checkbox',
  vocabularyAxes: ['size', 'intent'] as const,
  selectors: ['root', 'control', 'indicator', 'label', 'description', 'error'] as const,
  classes,
  defaults: { intent: 'primary', size: 'md' },
  // Checkbox declares no variants, so autoVars (which needs both `intent`
  // AND `variant` to produce anything, see auto-vars.ts) would return {}
  // here regardless; a custom resolver is required to derive the checked
  // fill from intent at all. `theme.intentResolver` is called directly with
  // a fixed `variant: 'filled'` (a checkbox's checked state is always a
  // solid fill, the way Button's `filled` variant reads), the same
  // contract autoVars itself calls through to, just without a `variant`
  // prop on this recipe to read it from.
  vars: (theme, props) => {
    const p = props as { size?: string; intent?: string };
    const size = CHECKBOX_SIZES[p.size ?? 'md'] ?? CHECKBOX_SIZES.md!;
    const resolved = theme.intentResolver({
      intent: p.intent ?? 'primary',
      variant: 'filled',
      theme,
    });
    return {
      control: {
        '--sb-checkbox-size': size,
        '--sb-checkbox-checked-bg': resolved.background,
        '--sb-checkbox-checked-color': resolved.color,
      },
    };
  },
  /**
   * The two-mode Field anatomy contract (authoring skill section 19), with
   * this recipe's locked compatibility decision layered on top: `label`
   * ALONE keeps the pre-migration native label-wraps-control containment
   * (pixel- and behaviour-identical for every existing call site, pinned by
   * the label-click test), and only `description`/`error` presence switches
   * the render into `Field.Root` anatomy mode, where the label renders
   * through `Field.Label` the way Switch's does. `data-layout="row"`
   * applies in anatomy mode (checkbox is a row control like Switch).
   * `useContext(FieldAnatomyContext)` inside this `render` function body is
   * legal for the reason TextInput.tsx's doc comment gives: the builder
   * calls `config.render(...)` as a plain, unconditional, synchronous
   * function call from a fixed point in its own render body.
   */
  render: ({ props, getStyles, ref }) => {
    // Vocabulary axis props (size/intent) are NOT stripped by the builder
    // before render and getStyles('control') already emits data-size/
    // data-intent there, so they're destructured out here rather than
    // spread onto the DOM. label/description/error are this recipe's own
    // convenience props, consumed below rather than forwarded to the
    // control. classNames/styles/vars/attributes/unstyled are the Styles
    // API's own config surface, not valid DOM attributes, and are stripped
    // the same way Alert.tsx/Badge.tsx strip them.
    const {
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
      ...rest
    } = props as CheckboxProps & Record<string, unknown>;

    const hasFieldAnatomy = description != null || error != null;
    const inAncestorField = useContext(FieldAnatomyContext);
    if (process.env.NODE_ENV !== 'production' && hasFieldAnatomy && inAncestorField) {
      console.warn(
        '[soribashi] Checkbox received description/error inside a hand-composed ' +
          'Field.Root. The two are mutually exclusive: use the bare control inside Field.Root ' +
          'and compose Field.Label/Field.Description/Field.Error yourself.',
      );
    }

    /*
     * `ref` lands on Checkbox.Root (the interactive control) in both modes,
     * not on the wrapper that carries the `root` selector's styles. This
     * diverges from Alert's convention (ref and `root` on the same element)
     * deliberately: a checkbox's ref is far more useful pointed at the
     * actual `role="checkbox"` control (focus/measure/query it directly,
     * the way a native `<input ref>` would) than at a non-interactive
     * wrapper.
     */
    const control = (
      <BaseCheckbox.Root
        ref={ref as Ref<HTMLElement>}
        {...(rest as Omit<CheckboxProps, 'label' | 'description' | 'error'>)}
        {...getStyles('control')}
      >
        <BaseCheckbox.Indicator {...getStyles('indicator')}>
          <CheckMark />
          <DashMark />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    );

    if (!hasFieldAnatomy) {
      return (
        // biome-ignore lint/a11y/noLabelWithoutControl: the association IS real, just invisible to this static check. Base UI's Checkbox.Root (an opaque custom component from biome's perspective) renders a hidden native <input type="checkbox"> as a descendant of this <label>; Checkbox.test.tsx's "toggles when the label text is clicked" case proves the association at runtime.
        <label {...getStyles('root')}>
          {control}
          {label != null ? <span {...getStyles('label')}>{label}</span> : null}
        </label>
      );
    }

    return (
      <Field.Root invalid={error != null} data-layout="row" {...getStyles('root')}>
        {/*
          Control BEFORE Field.Label -- a deliberate divergence from Switch's
          label-first row: a checkbox's convention is box-left, and bare mode
          already renders control-then-label, so both modes agree visually.
          The label association is id-based (Base UI's LabelableProvider),
          not order-based, so accessibility is unaffected.
        */}
        {control}
        {label != null ? <Field.Label {...getStyles('label')}>{label}</Field.Label> : null}
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

export const checkboxTheme = Checkbox.extend({});
