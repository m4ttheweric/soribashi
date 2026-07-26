import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { defineComponent } from '@soribashi/core';
import type { ReactNode, Ref } from 'react';
import classes from './Checkbox.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.4). Checkbox is a single `defineComponent`
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
   * Label text/content rendered beside the control, inside the same
   * `<label>` element the control mounts into. This is real label
   * association (native label-wraps-control semantics), not proximity: the
   * hidden native input Base UI's Root renders is a descendant of this
   * `<label>`, so clicking the label text dispatches a click at that input
   * the same way a native `<label><input type="checkbox">Text</label>`
   * would.
   */
  label?: ReactNode;
}

const CHECK_PATH = 'M3.5 7.5 6 10l6-7';

function CheckMark() {
  return (
    <svg
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

/**
 * `size`/`intent` are injected by `vocabularyAxes: ['size', 'intent']`
 * rather than declared on `CheckboxProps` directly (vocabulary axis props
 * come from the builder, not the recipe's own prop type): `defineComponent`
 * composes `InjectedVocabularyProps<TVocabAxes>` into the public type for
 * free, the same mechanism Alert/Badge get, so `Checkbox`'s `size`/`intent`
 * are narrowable by a themed `makeBuilders<TTheme>()` wrapper the same way
 * theirs are, unlike a hand-declared `string` prop would be. Checkbox
 * declares NO variant axis: a checkbox has exactly one visual treatment per
 * intent/size, so there is nothing for a `variant` tuple to select between.
 * All four generic params are supplied explicitly (TOwnProps, TSelectors,
 * TVariants, TVocabAxes) per the skill's generic-params trap.
 */
export const Checkbox = defineComponent<
  CheckboxProps,
  readonly ['root', 'control', 'indicator', 'label'],
  readonly [],
  readonly ['size', 'intent']
>({
  name: 'Checkbox',
  vocabularyAxes: ['size', 'intent'] as const,
  selectors: ['root', 'control', 'indicator', 'label'] as const,
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
  render: ({ props, getStyles, ref }) => {
    // Vocabulary axis props (size/intent) are NOT stripped by the builder
    // before render and getStyles('control') already emits data-size/
    // data-intent there, so they're destructured out here rather than
    // spread onto the DOM. classNames/styles/vars/attributes/unstyled are
    // the Styles API's own config surface, not valid DOM attributes, and
    // are stripped the same way Alert.tsx/Badge.tsx strip them.
    const {
      label,
      size: _size,
      intent: _intent,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as CheckboxProps & Record<string, unknown>;

    return (
      // biome-ignore lint/a11y/noLabelWithoutControl: the association IS real, just invisible to this static check. Base UI's Checkbox.Root (an opaque custom component from biome's perspective) renders a hidden native <input type="checkbox"> as a descendant of this <label>; Checkbox.test.tsx's "toggles when the label text is clicked" case proves the association at runtime.
      <label {...getStyles('root')}>
        {/*
          `ref` lands on Checkbox.Root (the interactive control), not this
          outer `<label>` that carries the `root` selector's styles. This
          diverges from Alert's convention (ref and `root` on the same
          element) deliberately: a checkbox's ref is far more useful pointed
          at the actual `role="checkbox"` control (focus/measure/query it
          directly, the way a native `<input ref>` would) than at a
          non-interactive label wrapper.
        */}
        <BaseCheckbox.Root
          ref={ref as Ref<HTMLElement>}
          {...(rest as Omit<CheckboxProps, 'label'>)}
          {...getStyles('control')}
        >
          <BaseCheckbox.Indicator {...getStyles('indicator')}>
            <CheckMark />
          </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>
        {label != null ? <span {...getStyles('label')}>{label}</span> : null}
      </label>
    );
  },
});

export const checkboxTheme = Checkbox.extend({});
