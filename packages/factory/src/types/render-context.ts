import type { CSSProperties, Ref } from 'react';
import type { FactoryPayload, FactoryStylesNames } from './factory-payload.ts';

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

export interface GetStylesOptions {
  active?: boolean;
  variant?: string;
  style?: CSSProperties;
  className?: string;
}

export interface RenderContext<P extends FactoryPayload> {
  props: P['props'];
  getStyles: GetStylesFn<P>;
  ref?: Ref<P['ref']>;
}
