import { pathToFileURL } from 'node:url';
import type { ResolvedTheme } from '@soribashi/theme';
import type { CodegenConfig } from './types.ts';

/**
 * Loads a soribashi config from a TypeScript or JavaScript file.
 *
 * The config file must:
 *   - export a default object
 *   - that object must have a `theme` field (a ResolvedTheme from createTheme)
 *   - that object must have an `output.css` path
 *
 * Bun's native TS loader handles the import.
 */
export async function loadConfig(absolutePath: string): Promise<CodegenConfig> {
  const url = pathToFileURL(absolutePath).toString();
  const mod = await import(url);

  if (!mod.default) {
    throw new Error(
      `[soribashi] Config at ${absolutePath} must have a default export. Found: ${Object.keys(
        mod,
      ).join(', ')}`,
    );
  }

  const config = mod.default as Partial<CodegenConfig>;

  if (!config.theme) {
    throw new Error(
      `[soribashi] Config at ${absolutePath} must have a "theme" field (use createTheme() from @soribashi/theme).`,
    );
  }

  if (!config.output?.css) {
    throw new Error(
      `[soribashi] Config at ${absolutePath} must have "output.css" set to the output path for theme.css.`,
    );
  }

  // A raw ThemeDefinition (author forgot createTheme()) crashes deep inside
  // the emitters with a bare TypeError; catch it here with a useful message.
  // vocabulary/semanticTokens/scope are always present on a ResolvedTheme and
  // absent from typical definitions.
  const theme: Partial<ResolvedTheme> = config.theme;
  const looksResolved =
    typeof theme === 'object' &&
    theme !== null &&
    theme.vocabulary !== undefined &&
    theme.semanticTokens !== undefined &&
    typeof theme.scope === 'string';
  if (!looksResolved) {
    throw new Error(
      `[soribashi] Config at ${absolutePath}: config.theme does not look like a ResolvedTheme; did you forget to wrap it in createTheme()?`,
    );
  }

  return config as CodegenConfig;
}
