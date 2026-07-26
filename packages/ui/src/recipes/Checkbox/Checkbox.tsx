import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import type { StylesApiProps, UniversalStyleProps } from '@soribashi/core';
import { defineGenericComponent } from '@soribashi/core';
import type { ReactNode, Ref } from 'react';
import classes from './Checkbox.module.css';

/** The four style slots getStyles() can target; also the Styles API's FactoryStylesNames. */
type CheckboxSlots = 'root' | 'control' | 'indicator' | 'label';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.4). Checkbox needs no real generic type
 * inference the way Select<TItem> eventually will, but it is still a
 * data-driven form control (checked/indeterminate/disabled state, a real
 * change event) rather than a pure styled primitive or a Base-UI-owned
 * open/close lifecycle compound, so `defineGenericComponent` is the builder
 * the playbook assigns to this category, not `defineComponent`/
 * `defineCompound`. Read by packages/ui/scripts/derive.ts to build the
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
 * at the type level below (defineGenericComponent does not strip it for
 * you), the way Popover.tsx strips it from every Base UI part it wraps.
 */
export interface CheckboxOwnProps
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
  /**
   * `size`/`intent` are declared here (not auto-injected the way
   * `defineComponent`'s `InjectedVocabularyProps` does for Alert/Badge):
   * `defineGenericComponent`'s TSignature pattern owns call-site prop typing
   * end to end (see GenericRenderCtx's doc comment in
   * define-generic-component.tsx), so a generic-component recipe author
   * writes its own public prop type rather than relying on the builder to
   * project `vocabularyAxes` into it. Typed `string` (not narrowed to the ui
   * theme's literal unions) to match Alert/Badge's own injected axis
   * props: `@soribashi/core`'s raw `defineComponent`/`defineGenericComponent`
   * exports are the theme-independent factory functions, and only the
   * `makeBuilders<TTheme>()` themed wrapper narrows an axis's type via
   * `ThemedVocabularyProps`, which no recipe in this package uses today.
   */
  size?: string;
  intent?: string;
}

export type CheckboxProps = CheckboxOwnProps &
  StylesApiProps<{ props: CheckboxOwnProps; stylesNames: CheckboxSlots }> &
  UniversalStyleProps;

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
 * come from the builder, not the recipe's own prop type). Checkbox declares
 * NO variant axis: a checkbox has exactly one visual treatment per
 * intent/size, so there is nothing for a `variant` tuple to select between.
 * All four generic params are supplied explicitly (TSignature, TSelectors,
 * TVariants, TVocabAxes) per the skill's generic-params trap.
 */
type CheckboxSignature = (
  props: CheckboxProps & { ref?: Ref<HTMLElement> },
) => React.ReactElement | null;

export const Checkbox = defineGenericComponent<
  CheckboxSignature,
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
