# @soribashi/theme

Soribashi's theme model: `createTheme`, `composeTheme`, declared vocabularies, and the token contract the rest of the stack resolves against.

```bash
bun add @soribashi/theme
```

```ts
import { createTheme, defineVocabulary } from '@soribashi/theme';

const size = defineVocabulary(['sm', 'md', 'lg']);
const theme = createTheme({ scope: 'app', vocabulary: { size } });
```

Vocabulary is declared, never assumed: Soribashi has no built-in opinion about what `size`, `intent`, or `variant` mean, and a declared tuple gives you compile-time narrowing plus a Zod-backed runtime check.

Most consumers install [`@soribashi/core`](../core) instead, which re-exports this package alongside the component factory.

Ships compiled JavaScript and `.d.ts` in `dist/`.

See the [repository README](https://github.com/m4ttheweric/soribashi#readme) for the full story, and [CHANGELOG.md](./CHANGELOG.md) for release notes.

MIT © Matthew Goodwin
