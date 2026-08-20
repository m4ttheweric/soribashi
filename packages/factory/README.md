# @soribashi/factory

Soribashi's component factory: `defineComponent`, `defineCompound`, polymorphic and generic builders, universal style props, and the theme-driven styling machinery behind them.

```bash
bun add @soribashi/factory @soribashi/theme react react-dom
```

```tsx
import { defineComponent } from '@soribashi/factory';
```

`react` and `react-dom` are peer dependencies (18 or 19).

Most consumers install [`@soribashi/core`](../core) instead, which re-exports this package alongside the theme model.

Ships compiled JavaScript and `.d.ts` in `dist/`.

The style-props machinery (extraction, parsing, per-property resolvers) is derived from [Mantine](https://mantine.dev) (MIT); each adapted file carries a header pointing at the original.

See the [repository README](https://github.com/m4ttheweric/soribashi#readme) for the full story, and [CHANGELOG.md](./CHANGELOG.md) for release notes.

MIT © Matthew Goodwin
