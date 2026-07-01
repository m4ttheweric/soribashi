import type { CSSProperties, Ref } from 'react';
import type { FactoryPayload, FactoryStylesNames } from './factory-payload.ts';
import type { Attributes, ClassNames, Styles, Vars } from './props.ts';

export interface GetStylesResult {
  className: string;
  style?: CSSProperties;
  [dataAttr: `data-${string}`]: unknown;
  [ariaAttr: `aria-${string}`]: unknown;
}

export type GetStylesFn<P extends FactoryPayload> = (
  selector: FactoryStylesNames<P>,
  options?: GetStylesOptions,
) => GetStylesResult;

/**
 * Per-call overrides passed as the second argument to `getStyles(selector, options)`.
 *
 * `className` and `style` apply directly to the resolved selector.
 *
 * `classNames` and `styles` represent the **part's own instance-level** styles-API
 * props (e.g., `<Foo.Label classNames={{ label: 'x' }}>`) — they are forwarded from
 * the part's merged props and mirror Mantine's TabsTab pattern where the part passes
 * its own `classNames`/`styles` into `ctx.getStyles(slot, { classNames, styles })`.
 *
 * `callClassNames` and `callStyles` are render-time per-call overrides from inside
 * the render function itself (e.g., `getStyles({ callClassNames: { icon: 'y' } })`).
 * Both layers are independent; `useStyles` resolves and applies them separately so
 * neither clobbers the other.
 *
 * `vars`, `attributes`, and `unstyled` are also forwarded from the part instance so
 * that compound parts behave as first-class styles-API consumers.
 */
export interface GetStylesOptions {
  active?: boolean;
  variant?: string;
  /**
   * Additional theme lookup name appended to the useStyles config names for
   * this call. Compound parts pass their flat registered name (e.g. `TabsTab`)
   * so theme entries produced by `Part.extend({...})` apply; later names take
   * precedence over earlier ones.
   */
  themeName?: string;
  style?: CSSProperties;
  className?: string;
  /** Part instance classNames (Mantine-matched layer: forwarded from the part's own props). */
  classNames?: ClassNames<FactoryPayload>;
  /** Part instance styles (Mantine-matched layer: forwarded from the part's own props). */
  styles?: Styles<FactoryPayload>;
  /**
   * Render-time per-call classNames override — applied on top of the part instance
   * layer. Kept separate from `classNames` so that both layers compose without clobbering
   * (the bug caught in review round 7).
   */
  callClassNames?: ClassNames<FactoryPayload>;
  /**
   * Render-time per-call styles override — applied on top of the part instance layer.
   */
  callStyles?: Styles<FactoryPayload>;
  /** Part instance vars resolver (CSS custom properties per-slot). */
  vars?: Vars<FactoryPayload>;
  /** Part instance per-slot HTML attributes. */
  attributes?: Attributes<FactoryPayload>;
  /** When true, suppresses built-in class output for the resolved slot. */
  unstyled?: boolean;
}

export interface RenderContext<P extends FactoryPayload> {
  props: P['props'];
  getStyles: GetStylesFn<P>;
  ref?: Ref<P['ref']>;
}
