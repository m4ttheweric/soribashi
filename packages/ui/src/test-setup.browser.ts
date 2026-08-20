// Registered as `setupFiles` in vitest.browser.config.ts. Imported once so
// every ui-browser test renders against the real generated theme.css instead
// of each test file importing it individually.
//
// This package's own artifact, produced by this package's codegen run and
// exported as `@soribashi/ui/theme.css` (SORI-13). It used to reach three
// directories up into apps/workshop, which made the package's tests depend on
// an app's build output.
import './generated/theme.css';
