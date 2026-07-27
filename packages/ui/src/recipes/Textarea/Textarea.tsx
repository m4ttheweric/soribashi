import { Input as BaseInput } from '@base-ui/react/input';
import type { ReactNode, Ref } from 'react';
import { useContext } from 'react';
import { defineComponent } from '../../builders.ts';
import { Field, FieldAnatomyContext } from '../Field/Field.tsx';
import classes from './Textarea.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.4). Textarea is a single `defineComponent`
 * with five slots, the same shape TextInput -- this contract's reference
 * implementation -- already proves out. Read by packages/ui/scripts/derive.ts
 * to build the agent-facing manifest; not itself derived, since it records
 * an authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 4 as const;

/**
 * Step 1's multiline-mechanism decision, made from the installed
 * node_modules/@base-ui/react/input/Input.d.ts and
 * node_modules/@base-ui/react/field/control/FieldControl.d.ts at
 * implementation time (not from memory):
 *
 * Base UI ships no separate Textarea export. Both sanctioned routes are
 * typed IDENTICALLY at the surface that matters here: `Input.Props` and
 * `Field.Control.Props` both extend `BaseUIComponentProps<'input', ...>`,
 * i.e. both fix their ElementType generic to `'input'` regardless of what
 * `render` actually mounts, so neither route's own .d.ts declares
 * `rows`/`cols` (real `<textarea>` attributes, not `<input>` ones) --
 * `rows` below is this recipe's own explicit prop, not inherited from Base
 * UI's type, forwarded to the mounted element through the ordinary
 * props-spread every other passthrough prop already uses.
 *
 * `Input` (`BaseInput` below) is chosen over `Field.Control` to stay
 * maximally aligned with TextInput: same import, same
 * `value`/`defaultValue`/`onValueChange` shape, same
 * already-empirically-verified (TextInput.test.tsx) auto-registration with
 * an enclosing `Field.Root` and `data-invalid` propagation. The only new
 * surface this recipe introduces over TextInput's own is `render={<textarea
 * />}` itself -- Base UI's own polymorphism mechanism, used internally here
 * (never exposed publicly; stripped at the type level below, the same
 * convention TextInput follows for its own `render`). Textarea.test.tsx's
 * first case (asserting `tagName === 'TEXTAREA'`) plus the label
 * -association, `data-invalid`, and `rows`-growth cases below are the
 * empirical confirmation the task brief asks for: all pass, so
 * `<Input render={<textarea />} />` is a real, working multiline route, not
 * a workaround.
 */
export interface TextareaProps
  extends Omit<BaseInput.Props, 'render' | 'className' | 'style' | 'size'> {
  /** Field label, rendered via `Field.Label` when present. See the module doc comment. */
  label?: ReactNode;
  /** Field description/hint, rendered via `Field.Description` when present. */
  description?: ReactNode;
  /** Field error, rendered via `Field.Error` (forced-visible) when present. */
  error?: ReactNode;
  /**
   * Number of visible text lines, forwarded to the mounted `<textarea>`
   * element. Not part of `Input.Props` (that type is fixed to the `'input'`
   * element regardless of the actual rendered tag; see the module doc
   * comment), so declared explicitly here.
   */
  rows?: number;
}

/**
 * Control MIN-heights keyed on the ui theme's size vocabulary, following the
 * dimension-record pattern (TextInput's TEXTINPUT_HEIGHTS, Button's
 * BUTTON_HEIGHTS) -- a MIN, not a fixed height, per the task brief: a
 * textarea grows with `rows`/content, so the size vocabulary sets a floor,
 * not a clamp. Lives in the recipe, not the framework, because
 * @soribashi/ui is a consumer and owns these values (CLAUDE.md invariant 2).
 * Carries the all-lowercase `--sb-textarea-minh` custom property, matching
 * the registry smoke's bundle-marker convention (derived from the registry
 * item name "textarea", see Textarea.module.css's `.textarea` rule).
 */
const TEXTAREA_MIN_HEIGHTS: Record<string, string> = {
  xs: '3rem',
  sm: '3.5rem',
  md: '4.5rem',
  lg: '5.5rem',
  xl: '6.5rem',
};

/**
 * The composed-mode contract -- IDENTICAL to TextInput's (TextInput.tsx's
 * own doc comment is the authoritative copy; this repeats only what differs
 * for a multiline control):
 *
 * - Bare mode renders ONLY the `<textarea>` element, no `Field.Root`
 *   wrapper; same known bare-mode limitation TextInput documents (no `root`
 *   element, so `data-size` never lands in bare mode -- sizing rides
 *   `--sb-textarea-minh` regardless).
 * - Anatomy mode renders `Field.Root`/`Field.Label`/the control/
 *   `Field.Description`/`Field.Error` in that order, matching Field.test.tsx's
 *   own composition order.
 * - Convenience props and hand-composed Field are mutually exclusive:
 *   Textarea warns (dev-only, message names "Textarea") rather than silently
 *   doing something different, and does NOT suppress its own internal
 *   `Field.Root` in that case (Textarea.test.tsx's nested-warning case pins
 *   this, the same pinned behaviour TextInput.test.tsx establishes for
 *   TextInput).
 *
 * `useContext(FieldAnatomyContext)` inside this `render` function body is
 * legal for the same reason TextInput.tsx's doc comment gives:
 * `defineComponent` calls `config.render(...)` as a plain, unconditional,
 * synchronous function call from a fixed point in its own render body,
 * functionally identical to inlining the hook call there.
 */
export const Textarea = defineComponent<
  TextareaProps,
  readonly ['root', 'label', 'description', 'error', 'textarea'],
  readonly [],
  readonly ['size']
>({
  name: 'Textarea',
  vocabularyAxes: ['size'] as const,
  selectors: ['root', 'label', 'description', 'error', 'textarea'] as const,
  classes,
  defaults: { size: 'md' },
  vars: (_theme, props) => {
    const p = props as { size?: string };
    return {
      textarea: {
        '--sb-textarea-minh': TEXTAREA_MIN_HEIGHTS[p.size ?? 'md'] ?? TEXTAREA_MIN_HEIGHTS.md!,
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    // Vocabulary axis props (size) are NOT stripped by the builder before
    // render, so `size` is destructured out here rather than spread onto the
    // DOM, matching TextInput. label/description/error are this recipe's own
    // convenience props, consumed below rather than forwarded to the
    // mounted textarea. classNames/styles/vars/attributes/unstyled are the
    // Styles API's own config surface, not valid DOM attributes, and are
    // stripped the same way every other recipe in this package strips them.
    // `rows` is deliberately left in `rest`: it is a real passthrough prop
    // (see the module doc comment), not consumed here.
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
    } = props as TextareaProps & Record<string, unknown>;

    const hasAnatomy = label != null || description != null || error != null;
    const inAncestorField = useContext(FieldAnatomyContext);
    if (process.env.NODE_ENV !== 'production' && hasAnatomy && inAncestorField) {
      console.warn(
        '[soribashi] Textarea received label/description/error inside a hand-composed ' +
          'Field.Root. The two are mutually exclusive: use the bare control inside Field.Root ' +
          'and compose Field.Label/Field.Description/Field.Error yourself.',
      );
    }

    const control = (
      <BaseInput
        ref={ref as Ref<HTMLTextAreaElement>}
        {...(rest as Omit<TextareaProps, 'label' | 'description' | 'error'>)}
        render={<textarea />}
        {...getStyles('textarea')}
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

export const textareaTheme = Textarea.extend({});
