import type { ResolvedTheme } from '@soribashi/theme';
import type { FactoryPayload, FactoryStylesNames } from './types/factory-payload.ts';

/**
 * Identity helper that types a vars resolver function for a given Factory.
 */
export function createVarsResolver<P extends FactoryPayload>(
  fn: (
    theme: ResolvedTheme,
    props: P['props'],
  ) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>>,
): (
  theme: ResolvedTheme,
  props: P['props'],
) => Partial<Record<FactoryStylesNames<P>, Record<string, string>>> {
  return fn;
}
