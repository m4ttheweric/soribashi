import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CodegenConfig } from './types.ts';
import { emitCss } from './emit-css.ts';
import { emitTailwindV3 } from './emit-tailwind-v3.ts';
import { emitTailwindV4 } from './emit-tailwind-v4.ts';

export interface BuildResult {
  written: string[];
}

/**
 * Runs all configured emitters and writes outputs to disk.
 * Creates parent directories as needed. Returns the list of written paths.
 */
export async function build(config: CodegenConfig): Promise<BuildResult> {
  const written: string[] = [];

  await writeFileEnsureDir(config.output.css, emitCss(config.theme, config.emit));
  written.push(config.output.css);

  if (config.output.tailwind) {
    const tw = config.output.tailwind;
    if (tw.mode === 'v3') {
      await writeFileEnsureDir(tw.configPath, emitTailwindV3(config.theme));
      written.push(tw.configPath);
    } else if (tw.mode === 'v4') {
      await writeFileEnsureDir(tw.themeCssPath, emitTailwindV4(config.theme));
      written.push(tw.themeCssPath);
    } else if (tw.mode === 'both') {
      await writeFileEnsureDir(tw.configPath, emitTailwindV3(config.theme));
      written.push(tw.configPath);
      await writeFileEnsureDir(tw.themeCssPath, emitTailwindV4(config.theme));
      written.push(tw.themeCssPath);
    }
  }

  return { written };
}

async function writeFileEnsureDir(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf-8');
}
