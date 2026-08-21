import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const PACKAGE_ROOT = join(import.meta.dirname, '../..');

/**
 * `./testing` (packages/core/src/testing) pulls in React/vitest/vitest-browser-react
 * — fine for a subpath consumers opt into explicitly, fatal if it ever reaches
 * the main `.` entry every consumer loads. Rebuilds fresh (rather than trusting
 * whatever `dist/` happens to be on disk) so this stays a real gate on current
 * source, not on however stale the last manual build was.
 */
beforeAll(() => {
  execFileSync('bun', ['run', 'build'], { cwd: PACKAGE_ROOT, stdio: 'pipe' });
}, 30_000);

describe('dist/src/index.js boundary', () => {
  it('carries no reference to the testing subpath', () => {
    const indexJs = readFileSync(join(PACKAGE_ROOT, 'dist/src/index.js'), 'utf-8');
    expect(indexJs).not.toContain('testing/');
  });
});
