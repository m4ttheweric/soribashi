// INTERNAL SHIM — private, never published, deliberately one line deep.
//
// The four @soribashi/* packages merged into ONE published package,
// @soribashi/core (packages/core). This directory survives only so file:-era
// consumers keep resolving with no edit on their side: ~/Documents/GitHub/
// tui-kit depends on "@soribashi/factory": "file:../soribashi/packages/factory"
// and must stay green until it migrates to the published @soribashi/core.
//
// It re-exports @soribashi/core's public surface — the same surface the old
// per-package barrels fed into, and everything the file:-era consumer reaches
// for through this name.
//
// DELETE THIS PACKAGE once tui-kit depends on @soribashi/core directly.
export * from '@soribashi/core';
