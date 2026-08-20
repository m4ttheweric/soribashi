<!-- Upstream issue draft for vitest (browser mode session poisoning).
     Matt chose NOT to file this upstream for now (2026-08-20) — preserved here
     so the repro and analysis survive. The minimal repro project layout is
     described inline. If filed later, paste the body below verbatim. -->

Title: browser mode: one file's unresolved import poisons the shared browser session for unrelated test files (real clicks silently stop registering)

### Describe the bug

In `browser.enabled` mode with a single project running multiple test files against one shared browser instance/page, a file that fails to import (e.g. a "Failed to resolve import" from a module that doesn't exist) doesn't just fail that one file — it corrupts something in the shared browser session so that *other, unrelated* test files that run in the same session start failing too, specifically:

- `userEvent.click(...)` (or other locator interactions) on a real, visible element silently does nothing — the click never registers, so any assertion depending on its effect fails.
- Which files are affected, and how many, appears to depend on execution/interleaving order and is not deterministic between runs: the same 4-file suite (2 "control" files, 1 file with the bad import, 1 more "control" file) fails a different subset of the 3 control files on different runs (all 3 failed on one run, only 1 of 3 failed on the next run in local repro testing).

This means a single expected-red TDD file (a `.test.tsx` importing a component that doesn't exist yet) can make an entire unrelated browser-mode test run look broken, which defeats the point of file-level test isolation.

### Reproduction

Minimal repro (no framework/React, plain DOM + userEvent):

`vitest.browser.config.ts`
```ts
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

`src/a-click.test.ts`, `src/b-click.test.ts`, `src/d-click.test.ts` (identical):
```ts
import { page, userEvent } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';

describe('click', () => {
  it('registers a real click', async () => {
    document.body.innerHTML = `<button id="btn">click me</button><div id="out"></div>`;
    const btn = document.getElementById('btn')!;
    const out = document.getElementById('out')!;
    btn.addEventListener('click', () => { out.textContent = 'clicked'; });
    await userEvent.click(page.getByRole('button', { name: 'click me' }));
    expect(out.textContent).toBe('clicked');
  });
});
```

`src/c-bad-import.test.ts`:
```ts
import { it } from 'vitest';
import { DoesNotExist } from './does-not-exist.ts'; // file doesn't exist

it('never gets here', () => {
  DoesNotExist();
});
```

Run `vitest run`. Expected: 3 files pass, 1 file fails to import (its own test reported as failed/errored). Actual: the import-failing file fails as expected, but one or more of the *other* files also fail, with `userEvent.click` not registering the click — `expected '' to be 'clicked'`. Repeated runs show a different subset of the 3 control files failing (all 3 on one run, 1 of 3 on the next), i.e. it's timing/interleaving-dependent rather than deterministic per file.

### Versions

- vitest: 4.1.10
- @vitest/browser-playwright: 4.1.10
- playwright: 1.59.1
- Node/Bun: reproduced under Bun 1.3.13 (bun run vitest); OS: macOS (darwin)

### Suspected cause

The browser-mode project runs one merged browser context/page across all files in the run (not one page per file). A file that throws during import (Vite's "Failed to resolve import") appears to leave the shared driver/page in a state where locator interactions from *other* files silently no-op instead of throwing or being isolated, rather than the resolve failure being scoped to just the failing file's own report.

### Suggested fix

Either: (a) fail fast/loudly and stop the run (or at least isolate) on an unresolved import in a test file instead of continuing to run other files against a possibly-corrupted shared session, or (b) ensure a per-file import/collection error can never leak into the shared browser driver state that other files' interactions depend on (e.g. reset/re-acquire the page or driver connection between files, or isolate collection errors from the running session).

### Local workaround in use

Scope runs to just the files being actively worked on during TDD RED (`vitest run --config vitest.browser.config.ts src/some-dir/`) rather than running the whole suite while a new file's import is still unresolved; only run the full suite once the new file resolves cleanly.
