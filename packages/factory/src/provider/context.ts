import { createContext } from 'react';
import { createTheme, type ResolvedTheme } from '@soribashi/theme';

/**
 * The default theme used when no SoribashiProvider is present in the tree.
 */
export const defaultContextTheme: ResolvedTheme = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: {},
    fontSize: {},
  },
});

export const SoribashiContext = createContext<ResolvedTheme>(defaultContextTheme);
