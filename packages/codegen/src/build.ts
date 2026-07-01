import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { emitCss } from './emit-css.ts';
import { emitTailwindV3 } from './emit-tailwind-v3.ts';
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

  // Resolve the `--__hsl-` companion-emit policy. Default ('auto') skips the
  // companion in v4-only Tailwind setups (where Tailwind v4's color-mix() runtime
  // doesn't need bare HSL components) and emits in all other cases (v3, both,
  // or no Tailwind at all). Explicit `true`/`false` overrides the auto-detect.
  const requested = config.emit?.emitCompanionHsl ?? 'auto';
  const resolvedCompanion: boolean =
    requested === 'auto' ? config.output.tailwind?.mode !== 'v4' : requested;
  const emitOpts = { ...config.emit, emitCompanionHsl: resolvedCompanion };

  await writeFileEnsureDir(config.output.css, emitCss(config.theme, emitOpts));
  written.push(config.output.css);

  if (config.output.tailwind) {
    const tw = config.output.tailwind;
    if (tw.mode === 'v3') {
      await writeFileEnsureDir(
        tw.configPath,
        emitTailwindV3(config.theme, { emitCompanionHsl: resolvedCompanion }),
      );
      written.push(tw.configPath);
    } else if (tw.mode === 'v4') {
      await writeFileEnsureDir(tw.themeCssPath, emitTailwindV4(config.theme));
      written.push(tw.themeCssPath);
    } else if (tw.mode === 'both') {
      await writeFileEnsureDir(
        tw.configPath,
        emitTailwindV3(config.theme, { emitCompanionHsl: resolvedCompanion }),
      );
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
