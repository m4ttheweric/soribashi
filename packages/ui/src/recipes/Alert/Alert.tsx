import { autoVars } from '@soribashi/core';
import type { MouseEventHandler, ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Alert.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts
 * to build the agent-facing manifest; not itself derived, since it records
 * an authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 * Alert is the first category-1 recipe with more than one visible slot
 * (icon/title/body/close alongside root), but it still renders exactly one
 * public element and never becomes anything else, so it stays category 1
 * rather than a compound (category 2/3): there is no open/close lifecycle
 * or set of independently-addressable parts, just one alert surface with
 * several style targets inside it.
 */
export const recipeCategory = 1 as const;

/**
 * Alert's own variant set. Deliberately three, not the theme's five: `ghost`
 * and `link` have no sane alert rendering, and inheriting them would commit
 * styling, contrast cells, and visual baselines for pairings no consumer
 * wants. Declared on the builder config (not via extend({ vocabulary })),
 * because RecipeMeta.variants, data-variant stamping, and dev validation all
 * key on this tuple.
 */
const ALERT_VARIANTS = ['filled', 'outline', 'subtle'] as const;

export interface AlertProps {
  /** Optional heading rendered in the title slot. */
  title?: ReactNode;
  /** Optional leading icon rendered in the icon slot. */
  icon?: ReactNode;
  /** Renders a close button in the close slot when true. @default false */
  withCloseButton?: boolean;
  /** Called when the close button is activated. */
  onClose?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
}

/**
 * `intent`/`variant` are injected by `vocabularyAxes: ['intent', 'variant']`
 * rather than declared on `AlertProps` directly (vocabulary axis props come
 * from the builder, not the recipe's own prop type); `getStyles('root')`
 * already stamps `data-intent`/`data-variant` from them, so Alert adds
 * nothing extra there.
 */
export const Alert = defineComponent<
  AlertProps,
  readonly ['root', 'icon', 'title', 'body', 'close'],
  readonly ['filled', 'outline', 'subtle'],
  readonly ['intent', 'variant']
>({
  name: 'Alert',
  vocabularyAxes: ['intent', 'variant'] as const,
  selectors: ['root', 'icon', 'title', 'body', 'close'] as const,
  variants: ALERT_VARIANTS,
  classes,
  defaults: { intent: 'info', variant: 'subtle' },
  // A recipe-supplied `vars` resolver REPLACES the builder's automatic
  // autoVars call rather than layering on top of it, so it has to be invoked
  // explicitly here to get the auto-derived --alert-bg/-color/-border vars
  // (see Button.tsx's identical merge-in pattern and the skill's "Traps"
  // section). Alert has no size-driven dimension var of its own, so there is
  // nothing else to merge in beyond autoVars's own result.
  vars: (theme, props) => ({
    root: { ...(autoVars(theme, 'Alert', props as Record<string, unknown>, true).root ?? {}) },
  }),
  render: ({ props, getStyles, ref }) => {
    const {
      title,
      icon,
      withCloseButton,
      onClose,
      children,
      intent: _intent,
      variant: _variant,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as AlertProps & Record<string, unknown>;
    return (
      <div role="alert" ref={ref as React.Ref<HTMLDivElement>} {...rest} {...getStyles('root')}>
        {icon ? <span {...getStyles('icon')}>{icon}</span> : null}
        <div {...getStyles('body')}>
          {title ? <div {...getStyles('title')}>{title}</div> : null}
          {children}
        </div>
        {withCloseButton ? (
          <button type="button" aria-label="Close" onClick={onClose} {...getStyles('close')}>
            ×
          </button>
        ) : null}
      </div>
    );
  },
});

export const alertTheme = Alert.extend({});
