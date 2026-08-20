// INTERNAL SHIM — private, never published, deliberately one line deep.
//
// The four @soribashi/* packages merged into ONE published package,
// @soribashi/core (packages/core), whose `./codegen` subpath carries what used
// to be @soribashi/codegen's programmatic API. This directory survives only so
// file:-era consumers keep resolving with no edit on their side:
// ~/Documents/GitHub/tui-kit depends on "@soribashi/codegen":
// "file:../soribashi/packages/codegen" and runs the `soribashi` bin from it,
// and must stay green until it migrates to the published @soribashi/core.
//
// DELETE THIS PACKAGE once tui-kit depends on @soribashi/core directly.
export * from '@soribashi/core/codegen';
