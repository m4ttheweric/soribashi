// Registered as `setupFiles` in vitest.browser.config.ts. Imported once so
// every ui-browser test renders against the real generated theme.css instead
// of each test file importing it individually.
import '../../../apps/workshop/src/generated/theme.css';
