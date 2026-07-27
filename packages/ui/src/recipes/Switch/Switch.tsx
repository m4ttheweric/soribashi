import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { ReactNode, Ref } from 'react';
import { useContext } from 'react';
import { defineComponent } from '../../builders.ts';
import { Field, FieldAnatomyContext } from '../Field/Field.tsx';
import classes from './Switch.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.5). Switch is a single `defineComponent` with
 * six slots, combining Checkbox's control template (a dimension record plus
 * `theme.intentResolver` for the checked fill) with the two-mode Field
 * anatomy contract TextInput/Textarea already prove out. It needs no real
 * generic type inference over an item type, so `defineComponent` handles its
 * fixed prop interface, multi-slot styling, and `vocabularyAxes` injection
 * directly. Read by packages/ui/scripts/derive.ts to build the agent-facing
 * manifest; not itself derived, since it records an authoring decision, not a
 * fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 4 as const;

/**
 * Base UI's real switch surface, enumerated from
 * node_modules/@base-ui/react/switch/{index.parts,root/SwitchRoot,root/SwitchRootDataAttributes,
 * thumb/SwitchThumb,thumb/SwitchThumbDataAttributes,stateAttributesMapping}.d.ts
 * PLUS the compiled `.js` sources (needed to answer the label-association
 * question below, which the `.d.ts` files alone don't settle) at
 * implementation time, not from memory:
 *
 * - Parts: `Switch.Root` and `Switch.Thumb`. `Root`'s own doc comment says it
 *   renders a `<span>` element and a hidden `<input>` beside -- despite the
 *   task brief's planning-time shorthand (a button with role="switch"), the
 *   actual default rendered tag is a `<span role="switch">` (confirmed in
 *   the compiled `SwitchRoot.js`: `useRenderElement('span', ...)`); acting
 *   like a button (keyboard activation via an internal `useButton` hook) is
 *   behavioural, not the literal tag. `Thumb` renders a plain `<span>`.
 * - Prop names match Checkbox's shape exactly:
 *   `checked`/`defaultChecked`/`onCheckedChange`/`disabled`, plus
 *   `readOnly`/`required`/`name`/`value`/`uncheckedValue`/`form`/`inputRef`.
 *   No `size` or `intent` prop exists on `SwitchRootProps` (it extends
 *   `BaseUIComponentProps<'span', ...>`, not an `<input>`/`<select>` element
 *   type that would carry a native `size` attribute the way TextInput's
 *   native `<input size>` did), so neither vocabulary axis needs an `Omit`
 *   here the way TextInput.tsx's own doc comment records for its collision.
 * - State attributes, read off `SwitchRootDataAttributes`/
 *   `SwitchThumbDataAttributes` (identical enums, both stamped via the same
 *   shared `stateAttributesMapping`): `data-checked`/`data-unchecked` (NOT a
 *   Radix-style `data-state="checked"`), plus `data-disabled`/`data-readonly`/
 *   `data-required`/`data-valid`/`data-invalid`/`data-touched`/`data-dirty`/
 *   `data-filled`/`data-focused` when wrapped in `Field.Root` -- confirming
 *   the brief's Task 5/6 finding (Base UI stamps `data-invalid` on the
 *   control when the Field is invalid) extends to Switch's `Root` AND
 *   `Thumb` alike, since both consume the same state object.
 * - Label association (the brief's Step 1 question): confirmed by reading
 *   `SwitchRoot.js`/`FieldRoot.js`/`FieldLabel.js`/`FieldControl.js`/
 *   `useLabel.js` together, not by inspecting any single `.d.ts`. `Field.Root`
 *   wraps its subtree in a `LabelableProvider` that generates ONE shared
 *   default id. `Field.Label`'s default `nativeLabel: true` renders a real
 *   `<label htmlFor={sharedId}>` (native `for`/`id` association, real click
 *   forwarding). `Switch.Root`, when `nativeButton` is left at its default
 *   `false`, assigns that SAME shared id to its hidden native
 *   `<input type="checkbox">` sibling (`hiddenInputId = controlId`), NOT to
 *   the visible `<span role="switch">` (which gets an unrelated
 *   auto-generated id instead). A native `<label for>` only forwards a real
 *   click to a labelable element per the HTML spec, and `<input>` -- unlike a
 *   plain `<span>` -- qualifies, so clicking the label dispatches a real
 *   click at the hidden checkbox input, which is what actually flips
 *   `checked`. Separately, the visible span's own accessible NAME comes
 *   through `aria-labelledby` pointing at the label's own id (an independent
 *   mechanism, always present regardless of the native-forwarding path).
 *   `nativeLabel={false}` is deliberately NOT set here: `FieldLabel.d.ts`'s
 *   warning about `nativeLabel` is scoped to controls whose interactive part
 *   IS itself a real `<button>` with no separate hidden input (`Select.Trigger`/
 *   `Combobox.Trigger`), where native label-click forwarding would toggle a
 *   popup open/closed, an unwanted side effect. Switch ships its own hidden,
 *   genuinely-labelable `<input>` specifically so `nativeLabel`'s default
 *   (real native association, real click forwarding) does the RIGHT thing --
 *   toggling the switch, the same outcome Checkbox's own hand-rolled
 *   containment `<label>` already produces. Switch.test.tsx's label-click
 *   case is the empirical proof either way, per the brief's own framing.
 * - `render` is Base UI's own polymorphism mechanism and is stripped at the
 *   type level below, the same convention every other Base-UI-backed recipe
 *   in this package follows.
 */
export interface SwitchProps extends Omit<BaseSwitch.Root.Props, 'render' | 'className' | 'style'> {
  /** Field label, rendered via `Field.Label` when present. See the module doc comment. */
  label?: ReactNode;
  /** Field description/hint, rendered via `Field.Description` when present. */
  description?: ReactNode;
  /** Field error, rendered via `Field.Error` (forced-visible) when present. */
  error?: ReactNode;
}

/**
 * The thumb's visible fill, drawn as an inline SVG circle filled with
 * `currentColor` rather than a CSS `background-color` on the thumb `<span>`
 * itself -- the same mechanism Checkbox.tsx's `CheckMark`/`DashMark` use for
 * their own glyphs, and for the same structural reason: it keeps
 * `Switch.Thumb`'s own `background-color` genuinely transparent (see
 * Switch.module.css's `.thumb` rule, which sets no `background` at all), so
 * the small-coverage contrast cell's `backdropClass` (the control's real,
 * opaque checked background) is actually used by `contrastRatio` instead of
 * being silently ignored the way it would be if the thumb painted its own
 * opaque background directly. `color`/`--sb-switch-checked-color` (set on
 * `.thumb` itself, not inherited from `.control`) drives the fill via
 * `currentColor`, exactly mirroring how Checkbox's indicator glyphs pick up
 * `--sb-checkbox-checked-color`.
 */
function ThumbDot() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      <circle cx="6" cy="6" r="6" />
    </svg>
  );
}

/**
 * Control heights keyed on the ui theme's size vocabulary, following the
 * dimension-record pattern (Checkbox's CHECKBOX_SIZES, TextInput's
 * TEXTINPUT_HEIGHTS). Lives in the recipe, not the framework, because
 * @soribashi/ui is a consumer and owns these values (CLAUDE.md invariant 2).
 * Carries the all-lowercase `--sb-switch-h` custom property Switch.module.css's
 * `.control` rule consumes for BOTH the track's block-size and (derived via
 * `calc()`) the track's inline-size and the thumb's geometry/travel distance,
 * so the whole control scales from this one variable.
 */
const SWITCH_HEIGHTS: Record<string, string> = {
  xs: '0.875rem',
  sm: '1rem',
  md: '1.25rem',
  lg: '1.5rem',
  xl: '1.75rem',
};

/**
 * The composed-mode contract, identical to TextInput's/Textarea's own (see
 * TextInput.tsx's doc comment for the authoritative copy), with one addition
 * this task brief calls for: anatomy mode renders `Field.Root` with
 * `data-layout="row"` (Field.module.css's `.root[data-layout='row']` rule,
 * landed in Task 4), so the label sits beside the control instead of above
 * it -- the natural reading order for a switch (Field owns both layouts; the
 * attribute-selector rule wins over the base `.root` rule by CSS specificity,
 * deterministically, never by source order).
 *
 * - Bare mode (no `label`/`description`/`error`): renders ONLY the control
 *   (`Switch.Root`/`Switch.Thumb`), no `Field.Root` wrapper. Same known
 *   bare-mode limitation TextInput/Textarea document: no `root` element, so
 *   `data-size`/`data-intent` never land in bare mode -- sizing/colour still
 *   ride `--sb-switch-h`/`--sb-switch-checked-bg` regardless.
 * - Anatomy mode renders `Field.Root`/`Field.Label`/the control/
 *   `Field.Description`/`Field.Error` in that order, matching Field.test.tsx's
 *   own composition order (label before control).
 * - Convenience props and hand-composed Field are mutually exclusive: Switch
 *   warns (dev-only, message names "Switch") rather than silently doing
 *   something different, and does NOT suppress its own internal `Field.Root`
 *   in that case, the same pinned behaviour TextInput.test.tsx/
 *   Textarea.test.tsx establish for their own recipes.
 *
 * `useContext(FieldAnatomyContext)` inside this `render` function body is
 * legal for the same reason TextInput.tsx's doc comment gives:
 * `defineComponent` calls `config.render(...)` as a plain, unconditional,
 * synchronous function call from a fixed point in its own render body,
 * functionally identical to inlining the hook call there.
 */
export const Switch = defineComponent<
  SwitchProps,
  readonly ['root', 'label', 'description', 'error', 'control', 'thumb'],
  readonly [],
  readonly ['size', 'intent']
>({
  name: 'Switch',
  vocabularyAxes: ['size', 'intent'] as const,
  selectors: ['root', 'label', 'description', 'error', 'control', 'thumb'] as const,
  classes,
  defaults: { size: 'md', intent: 'primary' },
  // Switch declares no variants, so autoVars (which needs both `intent` AND
  // `variant` to produce anything, see auto-vars.ts) would return {} here
  // regardless; a custom resolver is required to derive the checked colours
  // from intent at all. `theme.intentResolver` is called directly with a
  // fixed `variant: 'filled'` (a switch's checked track is always a solid
  // fill, the same call Checkbox.tsx's own `vars` resolver makes for its
  // checked fill), just without a `variant` prop on this recipe to read it
  // from. BOTH of intentResolver's fields are consumed, exactly as
  // Checkbox's own resolver consumes both: `.background` becomes the
  // checked track's fill (Switch.module.css's `.control[data-checked]`);
  // `.color` (the foreground already proven legible on top of `.background`
  // by the contrast matrix's full grid) becomes the checked thumb's own
  // fill, via `ThumbDot`'s `currentColor` (`.thumb[data-checked]`).
  vars: (theme, props) => {
    const p = props as { size?: string; intent?: string };
    const size = SWITCH_HEIGHTS[p.size ?? 'md'] ?? SWITCH_HEIGHTS.md!;
    const resolved = theme.intentResolver({
      intent: p.intent ?? 'primary',
      variant: 'filled',
      theme,
    });
    return {
      control: {
        '--sb-switch-h': size,
        '--sb-switch-checked-bg': resolved.background,
        '--sb-switch-checked-color': resolved.color,
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    // Vocabulary axis props (size/intent) are NOT stripped by the builder
    // before render and getStyles('control') already emits data-size/
    // data-intent there in anatomy mode's getStyles('root') call (not on
    // 'control' -- mirrors TextInput's bare-mode limitation note), so both
    // are destructured out here rather than spread onto the DOM. label/
    // description/error are this recipe's own convenience props, consumed
    // below rather than forwarded to the control. classNames/styles/vars/
    // attributes/unstyled are the Styles API's own config surface, not valid
    // DOM/Base-UI props, and are stripped the same way every other recipe in
    // this package strips them.
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
    } = props as SwitchProps & Record<string, unknown>;

    const hasAnatomy = label != null || description != null || error != null;
    const inAncestorField = useContext(FieldAnatomyContext);
    if (process.env.NODE_ENV !== 'production' && hasAnatomy && inAncestorField) {
      console.warn(
        '[soribashi] Switch received label/description/error inside a hand-composed ' +
          'Field.Root. The two are mutually exclusive: use the bare control inside Field.Root ' +
          'and compose Field.Label/Field.Description/Field.Error yourself.',
      );
    }

    // `ref` lands on `Switch.Root` (the interactive control), not on
    // `Field.Root` in anatomy mode: the same divergence from the
    // ref-and-root-slot-on-the-same-element convention Checkbox.tsx documents
    // and for the same reason -- a switch's ref is far more useful pointed at
    // the actual `role="switch"` element (focus/measure/query it directly)
    // than at a non-interactive wrapper.
    const control = (
      <BaseSwitch.Root
        ref={ref as Ref<HTMLElement>}
        {...(rest as Omit<SwitchProps, 'label' | 'description' | 'error'>)}
        {...getStyles('control')}
      >
        <BaseSwitch.Thumb {...getStyles('thumb')}>
          <ThumbDot />
        </BaseSwitch.Thumb>
      </BaseSwitch.Root>
    );
    if (!hasAnatomy) return control;

    return (
      <Field.Root invalid={error != null} data-layout="row" {...getStyles('root')}>
        {label != null ? <Field.Label {...getStyles('label')}>{label}</Field.Label> : null}
        {control}
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

export const switchTheme = Switch.extend({});
