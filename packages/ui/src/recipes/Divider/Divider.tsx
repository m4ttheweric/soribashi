// biome-ignore-all lint/a11y/useAriaPropsForRole: aria-valuenow is only required for the FOCUSABLE separator variant (an interactive splitter with a position to report); this recipe only ever renders the STATIC divider, which has no such value. File-level (not a line-level biome-ignore) because this rule does not attach reliably to a suppression comment placed directly above the JSX when aria-orientation is a dynamic expression rather than a string literal -- verified empirically against this exact element shape before reaching for the file-level form.
import type { ReactNode, Ref } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Divider.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

/**
 * Plain DOM, not Base UI's `separator` part, decided at implementation time:
 * a labelled divider needs a rule-label-rule composition regardless of which
 * mechanism draws the rule, and Base UI's `separator` part is a single
 * non-semantic `<div>` with no anatomy for a label at all -- it would only
 * replace this recipe's own root element, saving nothing, while still
 * requiring the exact same hand-rolled `role="separator"` +
 * `aria-orientation` (Base UI's part sets neither by default; ARIA reserves
 * `role="separator"` for a non-interactive divider like this one, distinct
 * from the interactive, resizable `role="separator"` a splitter would use)
 * and two-rule-segment layout this recipe already needs to build either way.
 */
export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  /** @default 'horizontal' */
  orientation?: DividerOrientation;
  /** Optional centred label; when present, two rule segments flank it instead of one continuous rule. */
  label?: ReactNode;
}

export const Divider = defineComponent<DividerProps, readonly ['root', 'label']>({
  name: 'Divider',
  selectors: ['root', 'label'] as const,
  classes,
  defaults: { orientation: 'horizontal' },
  render: ({ props, getStyles, ref }) => {
    // orientation/label are this recipe's own props, consumed directly below
    // instead of forwarded onto the root. classNames/styles/vars/attributes/
    // unstyled are the Styles API's own config surface, not valid DOM
    // attributes, and are stripped the same way every other recipe in this
    // package strips them.
    const {
      orientation = 'horizontal',
      label,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as DividerProps & Record<string, unknown>;

    return (
      // biome-ignore lint/a11y/useSemanticElements: <hr> is a void element and cannot hold the label/rule-segment children a labelled divider needs; role="separator" on a container element is the documented WAI-ARIA pattern for exactly this case.
      // biome-ignore lint/a11y/useFocusableInteractive: this is the STATIC (non-interactive) separator variant -- a visual/semantic divider, not a resizable splitter -- which WAI-ARIA explicitly does NOT require to be focusable; adding tabIndex would put a non-operable element in the tab order.
      <div
        ref={ref as Ref<HTMLDivElement>}
        role="separator"
        aria-orientation={orientation}
        data-orientation={orientation}
        {...rest}
        {...getStyles('root')}
      >
        <span className={classes.line} />
        {label != null ? (
          <>
            <span {...getStyles('label')}>{label}</span>
            <span className={classes.line} />
          </>
        ) : null}
      </div>
    );
  },
});

export const dividerTheme = Divider.extend({});
