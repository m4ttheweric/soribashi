import { useContext } from 'react';
import { SoribashiContext } from './context.ts';

/**
 * Returns the resolved soribashi theme from the nearest SoribashiProvider,
 * or a default empty theme if none is found.
 */
export function useTheme() {
  return useContext(SoribashiContext);
}
