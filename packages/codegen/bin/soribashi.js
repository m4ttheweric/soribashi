#!/usr/bin/env node
// INTERNAL SHIM BIN — private, never published.
//
// Keeps `soribashi <cmd>` working for file:-era consumers that installed the
// CLI through @soribashi/codegen (today: ~/Documents/GitHub/tui-kit, whose
// `bun run codegen` is literally `soribashi build`). The real CLI now ships in
// @soribashi/core; this delegates to its `./codegen` subpath rather than
// duplicating any argument handling.
//
// `#!/usr/bin/env node` rather than `bun`: this is plain JavaScript, so it runs
// under whichever runtime the consumer's package manager wires up.
//
// DELETE THIS PACKAGE once tui-kit depends on @soribashi/core directly and
// takes the `soribashi` bin from there.
import { runCli } from '@soribashi/core/codegen';

process.exit(await runCli(process.argv.slice(2)));
