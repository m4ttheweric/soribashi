# Changelog

All notable changes to `@soribashi/core` are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 — unreleased

First published release.

### Added

- Published to npm as a built artifact: `dist/` carries compiled JavaScript and `.d.ts` declarations, and the package's `exports` map points at them. Consumers no longer compile Soribashi's TypeScript source, and so no longer inherit its `tsconfig` requirements.
- `@soribashi/core/codegen` subpath export: the programmatic codegen API (`build`, `emitCss`, `emitTailwindV4`, `loadConfig`, `watch`).
- The `soribashi` CLI ships as this package's bin. There is nothing else to install.
- `src/` ships alongside `dist/` purely so declaration maps and source maps resolve; it is not an entry point.

### Changed

- **One package, not four.** `@soribashi/factory`, `@soribashi/theme`, and `@soribashi/codegen` merged into `@soribashi/core`. This happened before any of them reached the registry, so no published version is affected and there is nothing to migrate. They were four npm identities for one indivisible thing: nobody installs the factory without the theme model, and this package existed only as a barrel over the other three. The merge also removed the last `workspace:*` interdependencies, which were what made publishing a Bun-only operation.
- The `@soribashi` scope is kept deliberately. The org is the product: `@soribashi/core` is the mandatory surface, and anything genuinely optional that arrives later joins the org beside it rather than being folded in.

### Notes

- Pre-1.0: the public surface may still change between minor versions.
