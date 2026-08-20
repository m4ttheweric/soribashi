# @soribashi/core

Soribashi's whole framework in one package: the component factory's builders, the theme model, the style-prop machinery, the codegen API, and the `soribashi` CLI. Framework only — it ships no components.

```bash
bun add @soribashi/core react react-dom
```

```tsx
import { createTheme, defineComponent, SoribashiProvider } from '@soribashi/core';
```

```ts
import { emitCss } from '@soribashi/core/codegen';
```

```bash
bunx soribashi build     # or: bunx soribashi watch
```

Two entry points and a bin, and that is the entire published surface:

| Entry | What it is |
| --- | --- |
| `@soribashi/core` | The framework. `defineComponent`, `defineCompound`, the polymorphic and generic builders, `createTheme`, `composeTheme`, `defineVocabulary`, `SoribashiProvider`, `registerTheme`, style props, visibility props. |
| `@soribashi/core/codegen` | The codegen API — `build`, `emitCss`, `emitTailwindV4`, `loadConfig`, `watch` — for driving codegen programmatically. |
| `soribashi` | The CLI: theme -> CSS. Installed with the package; there is nothing else to add. |

This was four packages (`@soribashi/core`, `@soribashi/factory`, `@soribashi/theme`, `@soribashi/codegen`) before `0.1.0` ever reached the registry. They were four npm identities for one indivisible thing, so they became one. The `@soribashi` scope stays because the org is the product: core is the mandatory surface, and anything genuinely optional that arrives later joins the org beside it rather than being folded in.

Ships compiled JavaScript and `.d.ts` in `dist/`. Your `tsc` never type-checks Soribashi's source, so Soribashi's own `tsconfig` requirements are not inherited by your project. (`src/` rides along in the tarball only so declaration maps resolve for go-to-definition; it is not an entry point.)

The CLI needs [Bun](https://bun.sh) on `PATH` — a `soribashi.config.ts` is imported directly, and Bun's native TypeScript loader is what makes that work with no build step. The library itself is plain ESM and runs under Node, Bun, or any bundler.

See the [repository README](https://github.com/m4ttheweric/soribashi#readme) for the full story, and [CHANGELOG.md](./CHANGELOG.md) for release notes.

MIT © Matthew Goodwin
