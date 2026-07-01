import type { ComponentPropsWithRef, ElementType } from 'react';

/**
 * Computes the union of own props + the ref-bearing props of the target
 * element/component. Own props win over target props on conflict.
 *
 * `ComponentPropsWithRef<TAs>` already supplies a correctly-typed `ref` prop
 * for the target element (e.g. `Ref<HTMLButtonElement>` for `'button'`), so
 * consumers can pass `createRef<HTMLButtonElement>()` directly.
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

/**
 * Public props shape for a polymorphic component. Identical to
 * `PolymorphicProps` — the previous `& RefAttributes<PolymorphicRef<TAs>>`
 * intersection was redundant (since `ComponentPropsWithRef` already provides
 * `ref?`) and produced a tangled `RefObject<T> & RefObject<callback | RefObject<T> | null>`
 * type that rejected `createRef<T>()` without casts. Closes Gap 7-types.
 */
export type PolymorphicComponentProps<TAs extends ElementType, TOwnProps> = PolymorphicProps<
  TAs,
  TOwnProps
>;

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
