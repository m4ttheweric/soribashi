import { type ResolvedTheme, createTheme } from '@soribashi/theme';
import { createContext } from 'react';

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
