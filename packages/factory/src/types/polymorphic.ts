import type {
  ComponentPropsWithRef,
  ElementType,
  RefAttributes,
} from 'react';

/**
 * Computes the union of own props + the ref-bearing props of the target
 * element/component. Own props win over target props on conflict.
 */
export type PolymorphicProps<TAs extends ElementType, TOwnProps> = TOwnProps &
  Omit<ComponentPropsWithRef<TAs>, keyof TOwnProps | 'as'> & {
    as?: TAs;
  };

/**
 * Extracts the ref type for a polymorphic target element.
 */
export type PolymorphicRef<TAs extends ElementType> = ComponentPropsWithRef<TAs> extends {
  ref?: infer R;
}
  ? R
  : never;

export type PolymorphicComponentProps<
  TAs extends ElementType,
  TOwnProps,
> = PolymorphicProps<TAs, TOwnProps> & RefAttributes<PolymorphicRef<TAs>>;

export interface SoribashiPolymorphicComponent<TDefaultAs extends ElementType, TOwnProps> {
  <TAs extends ElementType = TDefaultAs>(
    props: PolymorphicComponentProps<TAs, TOwnProps>,
  ): React.ReactElement | null;
  displayName?: string;
}

export interface PolymorphicRenderProps<TOwnProps> {
  Element: ElementType;
  props: TOwnProps;
}
