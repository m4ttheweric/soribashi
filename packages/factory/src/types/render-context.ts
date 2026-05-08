import type { CSSProperties, Ref } from 'react';
import type { FactoryPayload, FactoryStylesNames } from './factory-payload.ts';
import type { ClassNames, Styles } from './props.ts';

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
 * `classNames` and `styles` follow the same resolution rules as root-level
 * `classNames`/`styles` but are scoped to the single call — useful for
 * compound parts that forward their own instance-level styles-API props.
 */
export interface GetStylesOptions {
  active?: boolean;
  variant?: string;
  style?: CSSProperties;
  className?: string;
  /** Per-call classNames map, merged on top of root-level classNames. */
  classNames?: ClassNames<FactoryPayload>;
  /** Per-call styles map, merged on top of root-level styles. */
  styles?: Styles<FactoryPayload>;
}

export interface RenderContext<P extends FactoryPayload> {
  props: P['props'];
  getStyles: GetStylesFn<P>;
  ref?: Ref<P['ref']>;
}
