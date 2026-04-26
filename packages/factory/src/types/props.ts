import type { CSSProperties, ReactNode } from 'react';
import type { ResolvedTheme } from '@soribashi/theme';
import type { FactoryPayload, FactoryStylesNames } from './factory-payload.ts';

export type ClassNames<P extends FactoryPayload> =
  | Partial<Record<FactoryStylesNames<P>, string>>
  | ((
      theme: ResolvedTheme,
      props: P['props'],
    ) => Partial<Record<FactoryStylesNames<P>, string>>);

export type Styles<P extends FactoryPayload> =
  | Partial<Record<FactoryStylesNames<P>, CSSProperties>>
  | ((
      theme: ResolvedTheme,
      props: P['props'],
    ) => Partial<Record<FactoryStylesNames<P>, CSSProperties>>);

export type Vars<P extends FactoryPayload> = (
  theme: ResolvedTheme,
  props: P['props'],
) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>>;

export type Attributes<P extends FactoryPayload> = Partial<
  Record<FactoryStylesNames<P>, Record<string, unknown>>
>;

/**
 * The Styles API base props every component accepts.
 */
export interface StylesApiProps<P extends FactoryPayload> {
  className?: string;
  style?: CSSProperties;
  classNames?: ClassNames<P>;
  styles?: Styles<P>;
  vars?: Vars<P>;
  attributes?: Attributes<P>;
  unstyled?: boolean;
  children?: ReactNode;
}

/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/styles-api/styles-api.types.ts (commit 63dafbbf)
 *
 * Variant of StylesApiProps for compound subcomponents (e.g., Tabs.List, Accordion.Item).
 * Compound subcomponents inherit Styles API surface from their parent and shouldn't
 * redeclare `unstyled` (set on the parent) or `attributes` (also set on the parent).
 */
export interface CompoundStylesApiProps<TPayload extends FactoryPayload>
  extends Omit<StylesApiProps<TPayload>, 'unstyled' | 'attributes'> {}
