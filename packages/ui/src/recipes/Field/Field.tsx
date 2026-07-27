import { Field as BaseField } from '@base-ui/react/field';
import type { PartRenderCtx } from '@soribashi/core';
import type { Ref } from 'react';
import { createContext } from 'react';
import { defineCompound } from '../../builders.ts';
import classes from './Field.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 4 = generic/form control (§ 2.5). The playbook's own "Three-unit
 * composition" table, in that same § 2.5 section, already places `Field` in
 * this category, as a "reusable form-control wrapper" alongside Select and
 * Checkbox, even though this slice authors it with `defineCompound` rather
 * than `defineComponent`: the category classifies what the recipe IS
 * (form-field anatomy other controls plug into), not which builder shape
 * happens to implement it. Read by packages/ui/scripts/derive.ts to build
 * the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 4 as const;

/**
 * True inside a soribashi Field.Root subtree. The composed-mode contract's
 * detection seam: a control given anatomy convenience props while inside a
 * hand-composed Field would nest Field.Root and break Base UI's
 * label/control association, so controls read this and warn in dev. Our own
 * context rather than Base UI's internal one: Base UI's field context is not
 * a public import surface, and this package controls both ends of the
 * contract anyway. Exported from this module (not the package barrel):
 * consuming controls (Tasks 5-8) import it via the sibling-relative path
 * '../Field/Field.tsx', the same way they import `Field` itself.
 */
export const FieldAnatomyContext = createContext(false);

/**
 * The full declared slot set, following the const-array convention
 * (Popover.tsx/Tabs.tsx): a bare type union can't be reported as
 * RecipeMeta.slots, so the array itself is passed to `defineCompound` as
 * `slotKeys`. All four parts here are both real Base UI parts AND real style
 * slots (unlike Popover, Field has no positioner-shaped extra styled slot,
 * and no part-without-a-slot either).
 */
const FIELD_SLOT_KEYS = ['root', 'label', 'description', 'error'] as const;
type FieldSlotKey = (typeof FIELD_SLOT_KEYS)[number];

type Ctx<TProps> = PartRenderCtx<TProps, object, readonly [], FieldSlotKey>;

/**
 * Base UI's real Field surface, enumerated from
 * node_modules/@base-ui/react/field/{index.parts,root/FieldRoot,label/FieldLabel,
 * description/FieldDescription,error/FieldError}.d.ts at implementation time
 * (not from memory, nor from the task brief's planning-time notes, which this
 * confirms rather than diverges from): installed parts are `Root`, `Label`,
 * `Error`, `Description`, `Control`, `Validity`, `Item`. Only `Root`/`Label`/
 * `Description`/`Error` become public soribashi parts this slice;
 * `Control`/`Validity`/`Item` are deliberately not wrapped (the brief's own
 * scope line: the four upcoming controls each own their real control
 * element -- TextInput's `<input>`, Switch's `<button role="switch">`, etc.
 * -- so wrapping `Field.Control` here would just be a second, redundant
 * abstraction over an element those recipes already render directly).
 *
 * `FieldRoot.Props` DOES carry a controlled `invalid?: boolean` field
 * ("Useful when the field state is controlled by an external library."),
 * confirming the plan's Task 5 assumption: a control can force Field into an
 * invalid, error-shown state without Base UI's own validate()/ValidityState
 * machinery, purely via this prop plus `Field.Error match`.
 *
 * `FieldLabel` renders a native `<label>` (`nativeLabel` defaults to `true`)
 * auto-associated with the field's control via Base UI's internal field
 * context -- real label-wraps-control semantics, not proximity; confirmed at
 * runtime by Field.test.tsx's "focuses the control when the label is
 * clicked" case. `FieldError.Props.match` accepts `boolean |
 * keyof ValidityState`; `true` always shows the error and hands visibility
 * control to the caller (an external validation library, or here, an
 * upstream control's own `invalid` prop), which is the controlled-error
 * mechanism the brief's forced-error test exercises directly.
 */
type RootProps = Omit<BaseField.Root.Props, 'render'> & {
  /**
   * Switches the anatomy from the default column stack to a row (label and
   * control side by side; see Field.module.css's `.root[data-layout='row']`
   * rule). A plain data attribute rather than a `layout` prop so the
   * attribute-selector rule wins over the base `.root` rule by CSS
   * specificity, never by source order (cross-file same-specificity order is
   * not deterministic under Vite CSS module concatenation). Task 7's Switch
   * stamps this directly when it renders its own internal `Field.Root`.
   */
  'data-layout'?: 'row';
};
type LabelProps = Omit<BaseField.Label.Props, 'render'>;
type DescriptionProps = Omit<BaseField.Description.Props, 'render'>;
type ErrorProps = Omit<BaseField.Error.Props, 'render'>;

/**
 * Strips the Styles API's own framework keys (consumed internally via
 * getStyles, not valid DOM/Base UI props) plus Base UI's `render` prop
 * (soribashi's compound parts do not expose it publicly). Shared by every
 * part below, same helper shape as Popover.tsx's `stripFrameworkKeys`.
 * `match` is deliberately NOT in this list: it is a real Base UI prop on
 * `Field.Error`, not a framework key, so it must flow through untouched.
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

const FieldCompound = defineCompound({
  name: 'Field',
  classes,
  slotKeys: FIELD_SLOT_KEYS,
  parts: {
    root: {
      // Wraps BaseField.Root in FieldAnatomyContext.Provider. No hooks are
      // needed inside this render function to do that (a Provider wrapping
      // a single child element is plain JSX, no state/effect involved), so
      // the "tiny inner component" escape hatch the task flagged as
      // acceptable if the provider made this awkward was not needed here;
      // it stayed a plain, one-level JSX wrap. Unlike Popover's root (a
      // context provider with no DOM of its own), BaseField.Root renders a
      // real `<div>`, so this part DOES call getStyles() and strip
      // framework keys, the same as every leaf part below.
      render: ({ props, getStyles, ref }: Ctx<RootProps>) => {
        const rest = stripFrameworkKeys(props);
        return (
          <FieldAnatomyContext.Provider value={true}>
            <BaseField.Root ref={ref as Ref<HTMLDivElement>} {...rest} {...getStyles()} />
          </FieldAnatomyContext.Provider>
        );
      },
    },
    label: {
      render: ({ props, getStyles, ref }: Ctx<LabelProps>) => {
        const rest = stripFrameworkKeys(props);
        // FieldLabel's own .d.ts types its ref as RefAttributes<HTMLElement>
        // (not HTMLLabelElement specifically), matched here rather than
        // narrowed further.
        return <BaseField.Label ref={ref as Ref<HTMLElement>} {...rest} {...getStyles()} />;
      },
    },
    description: {
      render: ({ props, getStyles, ref }: Ctx<DescriptionProps>) => {
        const rest = stripFrameworkKeys(props);
        return (
          <BaseField.Description
            ref={ref as Ref<HTMLParagraphElement>}
            {...rest}
            {...getStyles()}
          />
        );
      },
    },
    error: {
      render: ({ props, getStyles, ref }: Ctx<ErrorProps>) => {
        // `match` survives stripFrameworkKeys (it's a real Base UI prop, not
        // a framework key) and flows through in `rest` untouched.
        const rest = stripFrameworkKeys(props);
        return <BaseField.Error ref={ref as Ref<HTMLDivElement>} {...rest} {...getStyles()} />;
      },
    },
  },
});

/**
 * defineCompound's root part is designed to be used bare (see
 * Popover.tsx's identical comment); `Root` is aliased to the same component
 * so every call site reads `Field.Root`, `Field.Label`, `Field.Description`,
 * `Field.Error` uniformly.
 */
export const Field = Object.assign(FieldCompound, { Root: FieldCompound });

export const fieldTheme = Field.extend({});
