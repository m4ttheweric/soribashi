// INTERNAL SHIM — private, never published, deliberately one line deep.
//
// The four @soribashi/* packages merged into ONE published package,
// @soribashi/core (packages/core), which now carries this package's entire
// surface.
// This directory survives for exactly one reason: ~/Documents/GitHub/tui-kit
// depends on "@soribashi/theme": "file:../soribashi/packages/theme" and must
// stay green without a single edit on its side until it migrates to the
// published @soribashi/core.
//
// RESOLUTION CONTRACT — why nothing here declares a dependency on
// @soribashi/core, even though it imports it:
//
//   A `workspace:*` dependency inside a `file:` package is actively harmful in
//   a foreign repo. Reproduced in a scratch install: if the consumer cannot
//   resolve it, `bun install` HARD-FAILS ("failed to resolve"); and even where
//   it is tolerated, bun silently skips creating the package's
//   `node_modules/.bin` entries, which is how the `soribashi` bin went missing
//   the first time this shim was written that way.
//
//   `file:../core` is no better: bun COPIES a file: dependency into its store,
//   so the consumer would get a SECOND physical @soribashi/core — a snapshot
//   taken at install time, whose dist/ may not even have been built yet.
//
//   Declaring nothing is what actually works, and it is honest about the real
//   contract: a file:-era consumer of this shim is BY CONSTRUCTION a consumer
//   of @soribashi/core (that is the package this one is a shim FOR), so the
//   bare specifier resolves by ordinary walk-up to the copy the consumer
//   already installed — one module identity, never two. Verified end to end:
//   tui-kit's typecheck, test suite, and gates (including `soribashi build`
//   with zero codegen drift) all pass through these shims.
//
// DELETE THIS PACKAGE once tui-kit depends on @soribashi/core directly.
export * from '@soribashi/core';
