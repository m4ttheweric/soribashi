import type { ResolvedTheme } from '@soribashi/theme';
import type { ReactNode } from 'react';
import { SoribashiContext } from './context.ts';

export interface SoribashiProviderProps {
  theme: ResolvedTheme;
  children?: ReactNode;
}

/**
 * Provides the resolved soribashi theme to all components in the subtree.
 */
export function SoribashiProvider(props: SoribashiProviderProps) {
  return (
    <SoribashiContext.Provider value={props.theme}>{props.children}</SoribashiContext.Provider>
  );
}
