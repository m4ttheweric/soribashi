import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitCss } from '@soribashi/codegen';
import { tenantThemes } from '../src/theme/tenants.ts';

/**
 * Emits one CSS file per tenant theme using the configured scope selector.
 * Each theme's CSS is concatenated into a single `tenants.css` so the playground
 * can import all tenants with one stylesheet reference.
 */

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '..', 'src', 'generated', 'tenants.css');

async function main(): Promise<void> {
  const HEADER = `/* auto-generated tenant scopes — do not edit manually */`;
  const sections = tenantThemes.map(
    (theme) =>
      `/* tenant: ${theme.name ?? '(unnamed)'} — scope: ${theme.scope} */\n${emitCss(theme)}`,
  );
  const out = `${HEADER}\n\n${sections.join('\n')}`;

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, out, 'utf-8');
  console.log(`[playground] wrote ${tenantThemes.length} tenant scope(s) to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
