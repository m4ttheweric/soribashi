# Browser-Parity Tests

Computed-style assertions for all 14 soribashi layout blocks, running in a real browser via Playwright.

## What these tests verify

For each block, 3 prop configurations (default / common / stress) are rendered in a fixture page and queried via `window.getComputedStyle(...)`. The assertions confirm:

| Block | Key assertions |
|---|---|
| **Box** | `box-sizing: border-box`; `p="md"` → padding resolves to 12px; `hiddenFrom="md"` → `display: none` at ≥768px |
| **Stack** | `display: flex; flex-direction: column`; default gap = 12px (`--spacing-md`); `gap="lg"` = 16px |
| **Group** | `display: flex; flex-direction: row`; `justify="center"` → `justify-content: center`; `wrap="nowrap"` applies; `gap="xs"` = 4px |
| **Flex** | `display: flex`; `direction="column-reverse"` propagates; `justify`/`align` props map to CSS properties |
| **Grid** | Inner wrapper has `display: flex; flex-wrap: wrap`; `span=6/12` and `span=3/6` both compute ~50% width |
| **SimpleGrid** | `display: grid`; `cols=3` yields 3 equal tracks; `minColWidth` sets `data-auto-flow="auto-fill"` |
| **Container** | `size="md"` → `max-width: 960px`; `size="xl"` → 1320px; `fluid` → `max-width: 100%` |
| **Center** | `display: flex; justify-content: center; align-items: center`; `inline` → `display: inline-flex` |
| **AspectRatio** | Default child gets `aspect-ratio: 1/1`; `ratio={16/9}` and `ratio={4/3}` propagate correctly |
| **Space** | `h="md"` → computed height 12px; `h="xl"` → 24px; `w="lg"` → 16px |
| **Paper** | No border by default; `withBorder` → 1px solid border; `shadow="md"` produces non-empty box-shadow; `radius="lg"` → 8px |
| **Text** | Default font-size 16px; `size="sm"` → 14px; `lineClamp=3` → `-webkit-line-clamp: 3` |
| **Title** | `order=1` → font-size 34px (2.125rem), font-weight 700, renders as `<h1>`; `order=3` → 22px as `<h3>`; `lineClamp` applies |

Token reference (browser default 16px/rem):
- `--spacing-xs: 0.25rem` = 4px
- `--spacing-sm: 0.5rem` = 8px
- `--spacing-md: 0.75rem` = 12px
- `--spacing-lg: 1rem` = 16px
- `--spacing-xl: 1.5rem` = 24px
- `--heading-h1-font-size: 2.125rem` = 34px
- `--heading-h3-font-size: 1.375rem` = 22px
- `--container-size-md: 960px`, `--container-size-xl: 1320px`

## How to run locally

```sh
# From the repo root (worktree or main checkout)
bunx playwright test

# Run only a specific block's tests
bunx playwright test --grep "Stack"

# With the HTML report
bunx playwright test --reporter=html
open tests/browser-parity/playwright-report/index.html
```

The playground dev server (`http://localhost:5173`) starts automatically. If it's already running, Playwright will reuse it (`reuseExistingServer: true`).

### First-time setup

Chromium is fetched automatically on first run. If you need to reinstall:

```sh
bunx playwright install chromium
```

## Fixture page

The fixture is rendered at `/browser-fixtures.html` by:

- **HTML entry**: `apps/playground/browser-fixtures.html`
- **React entry**: `apps/playground/src/test-fixtures/main.tsx`
- **Fixture component**: `apps/playground/src/test-fixtures/BrowserFixtures.tsx`

Each block renders with `data-testid="{block}-{n}"` where n=0 (default), n=1 (common), n=2 (stress).

## When a test fails

1. **Read the failure message** — it shows the actual computed value from the browser.
2. **Check if Mantine changed**: compare `packages/blocks/src/{Block}/{Block}.css` against the upstream at `63dafbbf`.
3. **Check if a token changed**: look at `packages/theme/src/tokens/default-tokens.ts` and `apps/playground/src/generated/theme.css`.
4. **Common false positives**:
   - `gap` failures often mean a spacing token value changed — update the assertion.
   - `aspect-ratio` is reported as `"N / 1"` (fraction form) by Chromium, not as a float — the tests handle this with `toBeCloseTo`.
   - `display: -webkit-box` may compute to `"flow-root"` in newer Chromium — the lineClamp tests accept both.
5. **Fix**: update the block CSS/component to match Mantine's documented behaviour, then re-run.

## Highest-confidence assertions

These are the 5-10 tests most likely to catch real drift:

1. **`Stack [default] — gap resolves --spacing-md (12px)`** — catches gap token or CSS var changes
2. **`Title [order=1] — font-size is 34px`** — catches heading token or Title CSS var wiring
3. **`Box [hiddenFrom="md"] — display:none at 1280px viewport`** — catches visibility breakpoint logic
4. **`Grid.Col [span=6 columns=12] — flex-basis ≈ 50%`** — catches Grid column math regression
5. **`SimpleGrid [cols=3] — grid-template-columns has 3 equal tracks`** — catches SimpleGrid CSS var
6. **`Container [default size=md] — max-width is 960px`** — catches Container size token wiring
7. **`Paper [withBorder] — border-width is 1px`** — catches Paper `data-with-border` attribute logic
8. **`Text [lineClamp=3] — -webkit-line-clamp:3`** — catches Text line-clamp CSS var and attribute
9. **`AspectRatio [ratio=16/9] — child has correct aspect-ratio`** — catches vars-override-style-prop bug
10. **`Group [wrap="nowrap"] — flex-wrap:nowrap`** — catches Group CSS var for wrap prop
