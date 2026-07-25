import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { emitCss } from './emit-css.ts';
import { emitTailwindV4 } from './emit-tailwind-v4.ts';
import type { CodegenConfig } from './types.ts';
import { validateTheme } from './validate-theme.ts';

export interface BuildResult {
  written: string[];
}

/**
 * Runs all configured emitters and writes outputs to disk.
 * Creates parent directories as needed. Returns the list of written paths.
 *
 * Throws (without writing anything) when the theme fails validation — e.g.
 * semanticTokens references to nonexistent token families/shades/keys.
 */
export async function build(config: CodegenConfig): Promise<BuildResult> {
  validateTheme(config.theme);

  const written: string[] = [];

  await writeFileEnsureDir(config.output.css, emitCss(config.theme, config.emit));
  written.push(config.output.css);

  if (config.output.tailwind) {
    const tw = config.output.tailwind;
    await writeFileEnsureDir(
      tw.themeCssPath,
      emitTailwindV4(config.theme, { spacingUtilities: tw.spacingUtilities }),
    );
    written.push(tw.themeCssPath);
  }

  return { written };
}

async function writeFileEnsureDir(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf-8');
}
