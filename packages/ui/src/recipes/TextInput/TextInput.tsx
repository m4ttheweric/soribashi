import { Input as BaseInput } from '@base-ui/react/input';
import type { ReactNode, Ref } from 'react';
import { useContext } from 'react';
import { defineComponent } from '../../builders.ts';
import { Field, FieldAnatomyContext } from '../Field/Field.tsx';
import classes from './TextInput.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.5). TextInput is a single `defineComponent`
 * with five slots, the same shape Checkbox already proves out: it needs no
 * real generic type inference over an item type the way Select<TItem> does,
 * so `defineComponent` handles its fixed prop interface, multi-slot styling,
 * and `vocabularyAxes` injection directly. TextInput is also this slice's
 * reference implementation of the two-mode Field anatomy contract (Tasks 6-8
 * copy this render shape). Read by packages/ui/scripts/derive.ts to build the
 * agent-facing manifest; not itself derived, since it records an authoring
 * decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 4 as const;

/**
 * Base UI's real input surface, enumerated from
 * node_modules/@base-ui/react/input/{Input,InputDataAttributes}.d.ts and
 * node_modules/@base-ui/react/field/{root/FieldRoot,control/FieldControl}.d.ts
 * at implementation time (not from memory):
 *
 * - `Input` is Field.Control specialized: its own doc comment says "A native
 *   input element that automatically works with Field" -- confirmed by
 *   reading FieldControl.d.ts too ("You can omit this part and use any Base
 *   UI input component instead. For example, Input ... will work with Field
 *   out of the box"). So rendering a bare `<Input>` inside a `Field.Root`
 *   (ours or a hand-composed one) registers it with that Field automatically;
 *   no extra wiring is needed on this recipe's side.
 * - Value/change props are `value`/`defaultValue` (native-shaped) plus a
 *   Base-UI-specific `onValueChange?: (value: string, details) => void`
 *   callback fired on change -- there is no `onChange` in `InputProps`
 *   itself, though the underlying native `onChange` still passes through via
 *   `BaseUIComponentProps<'input', InputState>`'s `ComponentPropsWithRef<'input'>`
 *   base. `onValueChange` is the documented, Base-UI-idiomatic way to observe
 *   edits and is what TextInput.test.tsx's controlled-value case uses.
 * - The invalid-state attribute (Task 4's Step-1 question, answered here):
 *   `InputDataAttributes.invalid = 'data-invalid'`, "Present when the input
 *   is in an invalid state (when wrapped in Field.Root)". Confirmed this is
 *   driven by `FieldRoot.Props.invalid?: boolean` (the same controlled flag
 *   Field.tsx's own doc comment already established): setting `invalid` on
 *   `Field.Root` propagates `data-invalid` down onto the nested `<input>`
 *   itself via Base UI's internal field/control wiring, with no extra prop
 *   needed on `Input`. TextInput.module.css's `.input[data-invalid]` rule
 *   keys directly on this real, Base-UI-stamped attribute -- not a
 *   soribashi-invented `data-error` -- so `render` below sets
 *   `invalid={error != null}` on the internal `Field.Root` whenever an error
 *   is present.
 * - `render` is Base UI's own polymorphism mechanism and is not exposed
 *   publicly here (stripped at the type level below, the same convention
 *   every other Base-UI-backed recipe in this package follows).
 * - The native `<input>` element's own `size` HTML attribute (a `number`:
 *   visible width in characters, inherited via `BaseUIComponentProps`'s
 *   `ComponentPropsWithRef<'input'>` base) collides by name with this
 *   recipe's `size` vocabulary axis (a theme size key: `'xs' | 'sm' | ...`).
 *   `size` is therefore also omitted below, the same way `className`/`style`
 *   are omitted to let the Styles API's own versions win: the theme's `size`
 *   axis shadows the native HTML attribute entirely, matching how every
 *   other sized soribashi control (Button, Checkbox, Select) already treats
 *   `size` as vocabulary, not a passthrough DOM prop.
 */
export interface TextInputProps
  extends Omit<BaseInput.Props, 'render' | 'className' | 'style' | 'size'> {
  /** Field label, rendered via `Field.Label` when present. See the module doc comment. */
  label?: ReactNode;
  /** Field description/hint, rendered via `Field.Description` when present. */
  description?: ReactNode;
  /** Field error, rendered via `Field.Error` (forced-visible) when present. */
  error?: ReactNode;
}

/**
 * Control heights keyed on the ui theme's size vocabulary, following the
 * dimension-record pattern (Button's BUTTON_HEIGHTS, Select's
 * SELECT_TRIGGER_HEIGHTS). Lives in the recipe, not the framework, because
 * @soribashi/ui is a consumer and owns these values (CLAUDE.md invariant 2).
 * Deliberately matches Button/Select's own scale: a text input is sized for
 * the same pointer/keyboard target density as those other interactive
 * controls. Carries the all-lowercase `--sb-textinput-h` custom property the
 * registry smoke's bundle-marker assertion looks for (derived from the
 * registry item name "textinput", see TextInput.module.css's `.input` rule).
 */
const TEXTINPUT_HEIGHTS: Record<string, string> = {
  xs: '1.75rem',
  sm: '2rem',
  md: '2.25rem',
  lg: '2.5rem',
  xl: '2.75rem',
};

/**
 * The composed-mode contract (binding for Tasks 5-8, this recipe is the
 * reference implementation Tasks 6-8 copy):
 *
 * - Bare (no `label`/`description`/`error`): renders ONLY the `<input>`
 *   element, no `Field.Root` wrapper. Known limitation, documented here the
 *   same way Select.tsx documents its own no-DOM-root gap: with no `root`
 *   element in bare mode, `getStyles('root')` is never called, so
 *   `data-size` never lands anywhere in bare mode either -- sizing rides
 *   `--sb-textinput-h` regardless, unaffected by whether `data-size` is
 *   present.
 * - Anatomy (at least one of `label`/`description`/`error` present): renders
 *   `Field.Root` internally, wrapping `Field.Label`/the control/
 *   `Field.Description`/`Field.Error` in that order, matching Field.test.tsx's
 *   own composition order (label before control, for the real label-wraps
 *   -association Field.Label provides).
 * - Convenience props and hand-composed Field are mutually exclusive: giving
 *   TextInput anatomy props while it is already nested inside an ancestor
 *   `Field.Root` (read via `FieldAnatomyContext`) is a contract violation.
 *   TextInput warns (dev-only) rather than silently doing something
 *   different; it does NOT suppress its own internal `Field.Root` in that
 *   case (see TextInput.test.tsx's nested-warning case for the pinned,
 *   actually-observed behaviour of that double-Field-Root composition).
 *
 * `useContext(FieldAnatomyContext)` is called directly inside this `render`
 * function body. This is legal: `defineComponent`'s `Component` (the actual
 * `forwardRef` React component) calls `config.render(...)` as a plain,
 * unconditional, synchronous function call from a fixed point in its own
 * render body (see define-component.tsx) -- functionally identical, for the
 * Rules of Hooks, to inlining the hook call at that exact point in
 * `Component`'s own source. `defineCompound`'s non-polymorphic part wrapper
 * does the analogous thing today (`useContext(CompoundContext)` called
 * directly inside each part's own `forwardRef` render function), confirming
 * this pattern already holds elsewhere in the factory. No "lift into a tiny
 * inner component" escape hatch was needed.
 */
export const TextInput = defineComponent<
  TextInputProps,
  readonly ['root', 'label', 'description', 'error', 'input'],
  readonly [],
  readonly ['size']
>({
  name: 'TextInput',
  vocabularyAxes: ['size'] as const,
  selectors: ['root', 'label', 'description', 'error', 'input'] as const,
  classes,
  defaults: { size: 'md' },
  vars: (_theme, props) => {
    const p = props as { size?: string };
    return {
      input: { '--sb-textinput-h': TEXTINPUT_HEIGHTS[p.size ?? 'md'] ?? TEXTINPUT_HEIGHTS.md! },
    };
  },
  render: ({ props, getStyles, ref }) => {
    // Vocabulary axis props (size) are NOT stripped by the builder before
    // render and getStyles('input') already emits data-size there in
    // anatomy mode's getStyles('root') call (not on 'input' -- see the
    // module doc comment's bare-mode limitation note), so `size` is
    // destructured out here rather than spread onto the DOM. label/
    // description/error are this recipe's own convenience props, consumed
    // below rather than forwarded to the native <input>. classNames/styles/
    // vars/attributes/unstyled are the Styles API's own config surface, not
    // valid DOM attributes, and are stripped the same way every other
    // recipe in this package strips them.
    const {
      label,
      description,
      error,
      size: _size,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as TextInputProps & Record<string, unknown>;

    const hasAnatomy = label != null || description != null || error != null;
    const inAncestorField = useContext(FieldAnatomyContext);
    if (process.env.NODE_ENV !== 'production' && hasAnatomy && inAncestorField) {
      console.warn(
        '[soribashi] TextInput received label/description/error inside a hand-composed ' +
          'Field.Root. The two are mutually exclusive: use the bare control inside Field.Root ' +
          'and compose Field.Label/Field.Description/Field.Error yourself.',
      );
    }

    const control = (
      <BaseInput
        ref={ref as Ref<HTMLInputElement>}
        {...(rest as Omit<TextInputProps, 'label' | 'description' | 'error'>)}
        {...getStyles('input')}
      />
    );
    if (!hasAnatomy) return control;

    return (
      <Field.Root invalid={error != null} {...getStyles('root')}>
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

export const textInputTheme = TextInput.extend({});
