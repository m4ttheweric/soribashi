# @soribashi/codegen

The `soribashi` CLI. Reads a Soribashi theme and emits a stylesheet: colours as `oklch()`, dark overrides as `light-dark()` pairs, everything inside `@layer soribashi.tokens` / `@layer soribashi.recipes`, and non-colour tokens registered with `@property`.

```bash
bun add -d @soribashi/codegen
```

```ts
// soribashi.config.ts
import { createTheme } from '@soribashi/theme';

export default {
  theme: createTheme({ scope: 'app' }),
  output: { css: './src/generated/theme.css' },
};
```

```bash
bunx soribashi build     # emit once
bunx soribashi watch     # emit, then rebuild on change
```

## Requires Bun

The `soribashi` bin runs under [Bun](https://bun.sh) (`#!/usr/bin/env bun`), because a `soribashi.config.ts` is imported directly and Bun's native TypeScript loader is what makes that work with no build step. A `soribashi.config.js` / `.mjs` config works under any ESM runtime, but the shipped shebang still targets Bun.

Ships compiled JavaScript and `.d.ts` in `dist/`.

See the [repository README](https://github.com/m4ttheweric/soribashi#readme) for the full story, and [CHANGELOG.md](./CHANGELOG.md) for release notes.

MIT © Matthew Goodwin
