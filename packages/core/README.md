# @soribashi/core

The Soribashi barrel: one import for the component factory's builders and the theme model. Framework only — it ships no components.

```bash
bun add @soribashi/core react react-dom
```

```tsx
import { createTheme, defineComponent, SoribashiProvider } from '@soribashi/core';
```

`@soribashi/core` re-exports the public surface of [`@soribashi/factory`](../factory) and [`@soribashi/theme`](../theme); install those directly only if you want one without the other.

Ships compiled JavaScript and `.d.ts` in `dist/`. Your `tsc` never type-checks Soribashi's source, so Soribashi's own `tsconfig` requirements are not inherited by your project.

See the [repository README](https://github.com/m4ttheweric/soribashi#readme) for the full story, and [CHANGELOG.md](./CHANGELOG.md) for release notes.

MIT © Matthew Goodwin
