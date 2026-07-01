import type { ResolvedTheme } from '@soribashi/theme';
import type { CSSProperties, ReactNode } from 'react';
import type { FactoryPayload, FactoryStylesNames } from './factory-payload.ts';

export type ClassNames<P extends FactoryPayload> =
  | Partial<Record<FactoryStylesNames<P>, string>>
  | ((theme: ResolvedTheme, props: P['props']) => Partial<Record<FactoryStylesNames<P>, string>>);

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
 * Styles API surface for compound subcomponents (e.g., Tabs.List, Accordion.Item).
 *
 * Diverges from Mantine's CompoundStylesApiProps (which omits `unstyled` and
 * `attributes`): soribashi's part runtime forwards BOTH from the part instance
 * into getStyles (see define-compound partGetStyles), so the type matches the
 * runtime contract. Kept as a named alias so part surfaces stay distinguishable
 * from root surfaces at use sites.
 */
export interface CompoundStylesApiProps<TPayload extends FactoryPayload>
  extends StylesApiProps<TPayload> {}
