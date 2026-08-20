# Changelog

All notable changes to `@soribashi/codegen` are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The four framework packages (`@soribashi/core`, `@soribashi/factory`, `@soribashi/theme`, `@soribashi/codegen`) are versioned in lock step for now, so each release bumps all four together whether or not this package changed.

## 0.1.0 — unreleased

First published release.

### Added

- Published to npm as a built artifact: `dist/` carries compiled JavaScript and `.d.ts` declarations, and the package's `exports` map points at them. Consumers no longer compile Soribashi's TypeScript source, and so no longer inherit its `tsconfig` requirements.
- `src/` ships alongside `dist/` purely so declaration maps and source maps resolve; it is not an entry point.
- The `soribashi` bin resolves to the built `dist/bin/soribashi.js` and keeps its `#!/usr/bin/env bun` shebang. `soribashi --version` now finds the package manifest by walking up from its own module, so it reports the right version from an installed tarball as well as from a source checkout.

### Notes

- Pre-1.0: the public surface may still change between minor versions.
