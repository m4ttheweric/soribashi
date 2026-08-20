#!/usr/bin/env bun
// INTERNAL SHIM BIN — private, never published.
//
// Keeps `soribashi <cmd>` working for file:-era consumers that installed the
// CLI through @soribashi/codegen (today: ~/Documents/GitHub/tui-kit, whose
// `bun run codegen` is literally `soribashi build`). The real CLI now ships in
// @soribashi/core; this delegates to its `./codegen` subpath rather than
// duplicating any argument handling.
//
// THE PATH AND EXTENSION OF THIS FILE ARE LOAD-BEARING. It must stay
// `bin/soribashi.ts`, and package.json's `bin` must keep pointing there,
// because a lockfile RECORDS the bin map: tui-kit's committed bun.lock pins
//
//     "@soribashi/codegen": [..., "bin": { "soribashi": "./bin/soribashi.ts" }]
//
// and bun trusts the lock rather than re-reading this package.json on install.
// Point the bin anywhere else and a consumer installing from that committed
// lock gets NO `node_modules/.bin/soribashi` at all — `bun run codegen` dies
// with `soribashi: command not found` while the file sits right there in
// node_modules. Refreshing the consumer's lockfile would also fix it, but that
// is a consumer edit, and not needing one is this shim's entire job.
//
// Mode 755 is load-bearing for the same reason, one layer down: bun creates no
// `.bin` entry for a non-executable bin target, and fails silently about it.
//
// `#!/usr/bin/env bun` because this is TypeScript and Bun's native loader is
// what runs it directly — the same shebang the pre-merge bin carried.
//
// On the bare `@soribashi/core` specifier with nothing declaring it, see the
// resolution contract in ../shim/index.js. Short version: the consumer already
// depends on @soribashi/core, and declaring it here is what BREAKS this bin.
//
// DELETE THIS PACKAGE once tui-kit depends on @soribashi/core directly and
// takes the `soribashi` bin from there.
import { runCli } from '@soribashi/core/codegen';

process.exit(await runCli(process.argv.slice(2)));
