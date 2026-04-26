# Factory Parity Branches — useStyles + useProps

**Validated against:** Mantine master commit `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`  
**Audit date:** 2026-04-25  
**Files audited:**
- `packages/@mantine/core/src/core/styles-api/use-styles/use-styles.ts`
- `packages/@mantine/core/src/core/MantineProvider/use-props/use-props.ts`
- All helpers: `getClassName`, `getStyle`, `resolveClassNames`, `resolveStyles`, `mergeVars`, `resolveStyle`, `getGlobalClassNames`, `getStaticClassNames`, `getRootClassName`, `getSelectorClassName`, `getVariantClassName`, `getOptionsClassNames`, `getResolvedClassNames`, `useStylesTransform`, `filterProps`

---

## `useStyles` branches

| # | File:line | Branch description | Mantine behavior | Soribashi behavior |
|---|---|---|---|---|
| US-01 | use-styles.ts:69 | `name` as string vs array | Array normalizes: `(Array.isArray(name) ? name : [name]).filter(n => n)` — produces `themeName: string[]` used for multi-component theme lookup | Soribashi accepts only `name: string`. No array support. **INTENTIONAL_GAP** (see ledger) |
| US-02 | use-styles.ts:77-80 | `classNames` as function vs object — component-level | `resolveClassNames` wraps in array, calls function with `(theme, props, stylesCtx)` if function, else uses object directly | Soribashi: `resolveClassNames` calls `fn(theme, props)` — no `stylesCtx` param. **INTENTIONAL_GAP** |
| US-03 | use-styles.ts:77-80 | `classNames` as array (`ClassNamesArray`) | `resolveClassNames` handles arrays by iterating and merging with `cx()` | Soribashi: accepts only object or function, not array. **INTENTIONAL_GAP** |
| US-04 | use-styles.ts:78-80 | Multiple theme classNames sources (compound names) | Each name in `themeName` gets `resolveClassNames` called, producing `resolvedThemeClassNames: Partial<Record<string, string>>[]`; all are spread into `cx()` per selector | Soribashi: single theme classNames lookup — `themeComponent.classNames` only. **INTENTIONAL_GAP** |
| US-05 | use-styles.ts:82-84 | `withStylesTransform` flag — styles resolution | When `withStylesTransform=true`, component styles are set to `{}` (bypassed) | Soribashi: no style-transform concept. **INTENTIONAL_GAP** |
| US-06 | use-styles.ts:86-101 | Theme styles from multiple names | Loop over `themeName`, call `resolveStyles` per name, merge into `resolvedThemeStyles` with `Object.assign` per key | Soribashi: single `themeComponent.styles` lookup |
| US-07 | use-styles.ts:103-107 | `vars` resolution — headless guard | `varsResolver?.(theme, props, stylesCtx)` is skipped when `headless=true` | Soribashi: no headless concept. `varsResolver` is always called. **INTENTIONAL_GAP** |
| US-08 | use-styles.ts:104-106 | `vars` precedence: `varsResolver` < theme `vars` < instance `vars` | `mergeVars([headless ? {} : varsResolver, ...themeVars, instanceVars])` — `mergeVars` reduces left-to-right so LAST writer wins; instance `vars` wins | Soribashi: merges `builtInVars` (varsResolver) THEN `themeVarsResolverFromTheme` — **REVERSED** order. Theme vars win over built-in vars in Soribashi but built-in (varsResolver) should win less than theme vars; and then on top of that the `styleParts` array pushes builtInVars BEFORE themeVars so themeVars win. In Mantine `varsResolver` < `theme.vars` < instance `vars`. See detailed analysis. **BUG** |
| US-09 | use-styles.ts:109 | `resolveStyle` — `style` prop resolution | `resolveStyle` handles: array of styles (recursed), function form `(theme) => CSSProps`, null/undefined → `{}`, plain object | Soribashi: `config.style` is typed `CSSProperties` only; no function or array form. **INTENTIONAL_GAP** |
| US-10 | use-styles.ts:111-131 | `attributes` spread | `...attributes?.[selector]` spreads per-selector attributes into result | Soribashi: `themeAttrs` and `instanceAttrs` are spread separately; instance overrides theme. Functionally equivalent for object attributes. |
| US-11 | get-class-name.ts:91 | `getGlobalClassNames` — focus ring | Adds `theme.focusClassName || FOCUS_CLASS_NAMES[theme.focusRing]` when `options?.focusable && !unstyled` | Soribashi: no focus ring concept. No `focusable` option. **INTENTIONAL_GAP** |
| US-12 | get-class-name.ts:94 | `getVariantClassName` — variant class from `classes` map | Returns `classes[selector + '--' + variant]` when `options?.variant` is set and `!unstyled` | Soribashi: no `classes[selector--variant]` lookup. Soribashi emits `data-variant` only. **INTENTIONAL_GAP** |
| US-13 | get-class-name.ts:93 | resolvedThemeClassNames spread per selector | All theme classNames arrays' values for `selector` are spread into `cx()` | Soribashi: single theme className lookup (one name only) |
| US-14 | get-class-name.ts:95-96 | `resolvedClassNames[selector]` — component-level classNames | Object-form classNames resolved before hook returns, then per-selector value appended | Soribashi: same — `instanceClassNames[selector]` appended |
| US-15 | get-class-name.ts:97 | `getResolvedClassNames` — `transformedStyles` classNames | Resolved class names from CSS-in-JS transformed styles | Soribashi: not applicable. **INTENTIONAL_GAP** |
| US-16 | get-class-name.ts:98 | `getOptionsClassNames` — per-call `options.classNames` | `options.classNames` resolved using `options.props || props`, then per-selector value appended | Soribashi: `options?.className` is a plain string, NOT an object/function. **INTENTIONAL_GAP** |
| US-17 | get-class-name.ts:99 | `getRootClassName` — `className` on root selector | `className` appended only when `selector === rootSelector` | Soribashi: same — `isRoot ? config.className : ''` |
| US-18 | get-class-name.ts:100-108 | `getStaticClassNames` — prefix system | When `withStaticClasses && !headless`, emits `${classNamesPrefix}-${n}-${selector}` for each name | Soribashi: no static class prefix system. **INTENTIONAL_GAP** |
| US-19 | get-class-name.ts:108 | `options?.className` appended last | Per-call `className` option appended at end of `cx()` — highest specificity class | Soribashi: `callSiteClass = options?.className ?? ''` appended last in `cn()`. Equivalent. |
| US-20 | get-class-name.ts:99 | `getSelectorClassName` — `unstyled` suppresses built-in class | `unstyled || headless` suppresses `classes[selector]` | Soribashi: `config.unstyled ? '' : classes?.[selector] ?? ''`. Equivalent for `unstyled`; no headless. |
| US-21 | get-style.ts:44 | Style merge order: theme styles → component styles → options styles → vars → root style → options style | `{ ...resolvedThemeStyles[selector], ...resolvedStyles[selector], ...optionsStyles[selector], ...resolvedVars[selector], ...(root ? resolvedRootStyle : null), ...resolveStyle(options?.style) }` | Soribashi: `[themeStyles[sel], instanceStyles[sel], builtInVars[sel], themeVars[sel], style, options.style]` — same ordering except vars order **BUG** (see US-08) |
| US-22 | get-style.ts:46-49 | `options?.styles` resolved per-call | `resolveStyles` called with `options?.props || props` for per-call style override | Soribashi: no per-call `styles` option. **INTENTIONAL_GAP** |
| US-23 | get-style.ts:50 | `resolvedVars[selector]` — CSS variables merged into style | `mergeVars` result for selector spread into style | Soribashi: vars spread via `styleParts`. Functionally equivalent but order differs (see US-08) |
| US-24 | use-styles.ts:57 | `rootSelector` configurable | Default `'root'` but caller can set any selector as root | Soribashi: hardcoded `'root'`. **INTENTIONAL_GAP** |
| US-25 | use-styles.ts:54 | `stylesCtx` parameter passed to all callbacks | All `resolveClassNames`, `resolveStyles`, `getStyle` calls receive `stylesCtx` | Soribashi: no `stylesCtx`. **INTENTIONAL_GAP** |
| US-26 | use-styles.ts:68 | `headless` mode — skips all Mantine classes | `useMantineIsHeadless()` from context; when true: no `varsResolver`, no `getSelectorClassName`, no static classes | Soribashi: no headless mode. **INTENTIONAL_GAP** |
| US-27 | use-styles.ts:66-67 | `classNamesPrefix` + `withStaticClasses` from context | Resolved via context hooks; default prefix is `'mantine'` | Soribashi: no prefix system. **INTENTIONAL_GAP** |
| US-28 | resolve-class-names.ts:14-28 | `mergeClassNames` uses `cx()` for same-key collision | When two classNames objects have same selector key, values are joined with `cx()` | Soribashi: array classNames not supported; no per-key merge path |
| US-29 | merge-vars.ts:6-16 | `mergeVars` uses `filterProps` per key | Each vars object is shallow-merged with `filterProps` to strip `undefined` values | Soribashi: no `filterProps` applied to vars; direct `Object.assign` in `mergeStyles`. Vars with `undefined` values NOT stripped. **BUG** |
| US-30 | resolve-style.ts:11-26 | `resolveStyle` handles array, function, null, plain object | Four-branch: array → recurse+reduce; function → call with theme; null/undefined → `{}`; object → return as-is | Soribashi: `config.style` only accepts plain `CSSProperties`. **INTENTIONAL_GAP** |
| US-31 | get-options-class-names.ts:19-25 | `options.props` overrides component `props` for classNames resolution | When `options?.props` is set, that object is used instead of component `props` for function-form classNames | Soribashi: no `options.props`. **INTENTIONAL_GAP** |
| US-32 | get-global-class-names.ts:21 | `options.active` → `theme.activeClassName` | When `active && !unstyled`, applies `theme.activeClassName` to className | Soribashi: `active: true` sets `data-active=true`, does NOT add a class. **INTENTIONAL_GAP** (different mechanism) |
| US-33 | get-static-class-names.ts:15-16 | `withStaticClass=false` suppresses static class for specific call | Per-call option to suppress the static class | Soribashi: no static class system. **INTENTIONAL_GAP** |

---

## `useProps` branches

| # | File:line | Branch description | Mantine behavior | Soribashi behavior |
|---|---|---|---|---|
| UP-01 | use-props.ts:15-17 | `defaultProps` as object vs function | `typeof contextPropsPayload === 'function' ? contextPropsPayload(theme) : contextPropsPayload` | Soribashi: same check — `typeof themeDefaultsRaw === 'function' ? fn(theme) : themeDefaultsRaw ?? {}`. Equivalent. |
| UP-02 | use-props.ts:19 | Merge order: `defaults` → `contextProps` → `filterProps(props)` | `{ ...defaultProps, ...contextProps, ...filterProps(props) }` — lowest to highest | Soribashi: `{ ...defaults, ...themeDefaults, ...filteredInstance }` (for loop). Equivalent. |
| UP-03 | use-props.ts:1 | `filterProps` strips `undefined` from instance props | `filterProps` removes keys with `undefined` values | Soribashi: `for (key in instance) { if (instance[key] !== undefined) merged[key] = instance[key] }`. Equivalent effect. |
| UP-04 | use-props.ts:15 | `theme.components[component]` may not exist | `theme.components[component]?.defaultProps` → `undefined` if no theme config | Soribashi: `theme.components[name]?.defaultProps` → same optional chaining. Equivalent. |
| UP-05 | use-props.ts:16-17 | `contextPropsPayload === undefined` (no theme component) | `contextProps` is `undefined`; spread of `undefined` is a no-op | Soribashi: `themeDefaultsRaw ?? {}` falls back to `{}` explicitly. Equivalent effect (spreading `{}` vs spreading `undefined` both produce no-op). |
| UP-06 | use-props.ts:19 | `defaultProps` is `null` | Spread of `null` is... actually a bug in Mantine? `{ ...null }` is `{}` in JS | Soribashi: `defaults ?? {}` explicitly coerces `null` to `{}`. Same behavior (both result in no-op spread). |
| UP-07 | use-props.ts:19 | Instance props are empty `{}` | `filterProps({})` → `{}`; result is `{ ...defaults, ...contextProps }` | Soribashi: same — for loop over empty object adds nothing. Equivalent. |
| UP-08 | use-props.ts:19 | Instance prop with `false`, `0`, or `''` values are NOT filtered | `filterProps` only strips `undefined`, not falsy values like `false`/`0`/`''` | Soribashi: `instance[key] !== undefined` check — same: only strips `undefined`. Equivalent. |
| UP-09 | use-props.ts:4-8 | Return type enriches non-optional keys for defined defaultProps | TypeScript enrichment makes keys defined in `defaultProps` non-optional in return type | Soribashi: returns `P` — simpler return type without enrichment. **INTENTIONAL_GAP** (TypeScript only) |

---

## Summary counts

- Total branches enumerated: **42** (33 useStyles + 9 useProps)
- Intentional gaps (Mantine features soribashi deliberately omits): 21
- Potentially equivalent: 14
- Suspected bugs requiring testing: 2 (US-08 vars precedence, US-29 undefined vars not filtered)

---

## Vars precedence analysis (US-08)

Mantine `mergeVars` call order:
```
mergeVars([
  headless ? {} : varsResolver?.(theme, props, stylesCtx),  // [0] built-in vars (lowest)
  ...themeName.map(n => theme.components[n]?.vars?.(theme, props, stylesCtx)),  // [1..n] theme vars
  vars?.(theme, props, stylesCtx),  // [n+1] instance vars (highest)
])
```
`mergeVars` reduces left-to-right with `{ ...acc[key], ...filterProps(current[key]) }`, so LAST writer wins.
Precedence (lowest to highest): `varsResolver` < `theme.vars` < instance `vars`.

Soribashi `styleParts` order in `use-styles.ts`:
```ts
const styleParts = [
  themeStyles[sel],       // theme styles
  instanceStyles[sel],    // instance styles
  builtInVars[sel],       // varsResolver result  ← pushed at index 2
  themeVarsResolverFromTheme[sel],  // theme.vars result  ← pushed at index 3
];
```
`mergeStyles` is `Object.assign(acc, p)` (left-to-right, last wins).

So in soribashi: `themeStyles` < `instanceStyles` < `varsResolver` < `theme.vars`.
In Mantine: `themeStyles` < `componentStyles` < `optionStyles` < `varsResolver` < `theme.vars` < `instance.vars`.

The relative precedence of `varsResolver` vs `theme.vars` is the **same** in both: `varsResolver` < `theme.vars`.
However, in Mantine instance `vars` (the `vars` prop on the component instance) is the HIGHEST precedence — and soribashi has no concept of an instance `vars` prop.
Also: in Mantine, `componentStyles` < `varsResolver`, meaning CSS variables from varsResolver are LOWER priority than inline styles... but both share the same `style` attribute so this is just ordering within `style`. The overall shape is equivalent for the varsResolver < theme.vars relationship.

**Conclusion on US-08:** Soribashi's `varsResolver` < `theme.vars` order is correct. The instance `vars` prop is missing (**INTENTIONAL_GAP** already noted in ledger).

## Undefined vars filtering (US-29)

Mantine: `mergeVars` uses `filterProps(current[key]!)` per key — strips `undefined` CSS variable values.
Soribashi: `mergeStyles` uses `Object.assign` — preserves `undefined` CSS variable values in the style object.

If `varsResolver` returns `{ root: { '--btn-bg': undefined } }`, Mantine would strip the `--btn-bg` key from the style, while soribashi would include it as `undefined`. Browsers ignore CSS properties with `undefined` values (the string "undefined"), but the resulting `style` object differs.

**Conclusion:** This is a minor behavioral divergence. **BUG** — but low severity. The style object will contain `undefined`-valued CSS vars which is semantically wrong (React renders "undefined" string for CSS vars with undefined value).
