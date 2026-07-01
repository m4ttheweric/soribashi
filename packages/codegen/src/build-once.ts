// Subprocess entry used by watch mode: loads the config fresh and runs one
// build. Run via `bun src/build-once.ts <configPath>`. Prints the build result
// as JSON on stdout; errors go to stderr with a non-zero exit.
import { loadConfig } from './load-config.ts';
import { build } from './build.ts';

const configPath = process.argv[2];
if (!configPath) {
  console.error('[soribashi] build-once: missing config path argument');
  process.exit(1);
}

try {
  const config = await loadConfig(configPath);
  const result = await build(config);
  console.log(JSON.stringify({ written: result.written }));
} catch (err) {
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
}
