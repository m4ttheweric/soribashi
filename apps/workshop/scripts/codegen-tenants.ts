import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitCss } from '@soribashi/codegen';
import { tenantThemes } from '../src/theme/tenants.ts';

/**
 * Emits one CSS file per tenant theme using the configured scope selector.
 * Each theme's CSS is concatenated into a single `tenants.css` so the workshop
 * can import all tenants with one stylesheet reference.
 *
 * Passes `{ utilities: false }`: the visibility utility classes
 * (.sb-hidden-from-*, .sb-visible-from-*, .sb-light-hidden, .sb-dark-hidden)
 * are global, breakpoint-driven rules already emitted once into the root
 * theme.css by `bun run codegen`, not per-tenant token values, so restating
 * them per tenant here would only duplicate identical rules N times over.
 */

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '..', 'src', 'generated', 'tenants.css');

async function main(): Promise<void> {
  const HEADER = '/* auto-generated tenant scopes: do not edit manually */';
  const sections = tenantThemes.map(
    (theme) =>
      `/* tenant: ${theme.name ?? '(unnamed)'}, scope: ${theme.scope} */\n${emitCss(theme, { utilities: false })}`,
  );
  const out = `${HEADER}\n\n${sections.join('\n')}`;

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, out, 'utf-8');
  console.log(`[workshop] wrote ${tenantThemes.length} tenant scope(s) to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
