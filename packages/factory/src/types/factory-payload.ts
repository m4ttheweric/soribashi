/**
 * The Factory payload type — the contract every soribashi component declares.
 */
export interface FactoryPayload {
  props: Record<string, any>;
  ref?: any;
  /** Union of selector names (e.g. 'root' | 'label' | 'icon') for the Styles API */
  stylesNames?: string;
  /** Per-selector CSS variable surface */
  vars?: Record<string, string>;
  /** Union of variant names */
  variant?: string;
  /** Compound sub-components */
  staticComponents?: Record<string, any>;
  compound?: boolean;
}

export type FactoryProps<P extends FactoryPayload> = P['props'];

export type FactoryStylesNames<P extends FactoryPayload> = P['stylesNames'] extends string
  ? P['stylesNames']
  : never;

export type FactoryVars<P extends FactoryPayload> = P['vars'] extends Record<string, string>
  ? P['vars']
  : never;
