// Ambient declaration for plain CSS side-effect imports (Vite handles these
// at build time). Scoped narrowly rather than the full `vite/client`
// triple-slash reference: that reference augments the global `ImportMeta`
// interface program-wide, and this repo's root typecheck runs a single
// `tsc -p tsconfig.json` across every package and app together. That
// augmentation would make the `@ts-expect-error` comments guarding
// `import.meta.env` in packages/factory/src/style-props/theme-resolvers/is-dev.ts
// and packages/factory/src/validate-vocabulary-props.ts spuriously "unused",
// even though this app never touches import.meta.env itself.
declare module '*.css';
