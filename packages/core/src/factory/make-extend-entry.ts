import type { ThemeComponentEntry } from './theme-component-entry.ts';
import type { ComponentExtendConfig } from './types/component-extend.ts';

/**
 * Builds the `.extend()` static for a component registered under `name`.
 * Single source of truth for ThemeComponentEntry construction across all
 * builders (root components and compound parts).
 */
export function makeExtendEntry<TProps>(name: string) {
  return (extendConfig: ComponentExtendConfig<TProps>): ThemeComponentEntry<TProps> => ({
    __soribashiThemeEntry: true as const,
    name,
    // Vocabulary stored as-is; function-form values resolved by createTheme/
    // normalize-components. Cast because the entry type expects the concrete
    // Vocabulary (post-resolution) shape.
    vocabulary: extendConfig.vocabulary as never,
    defaultProps: extendConfig.defaultProps ?? {},
    classNames: extendConfig.classNames,
    styles: extendConfig.styles,
    vars: extendConfig.vars,
    attributes: extendConfig.attributes,
  });
}
