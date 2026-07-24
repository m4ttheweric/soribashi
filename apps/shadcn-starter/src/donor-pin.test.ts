/**
 * Donor pin verification.
 *
 * Every manifest entry records the sha256 of the shadcn source file it was
 * converted from. This re-hashes the pinned checkout and fails when the two
 * disagree. A failure here means the donor moved (or the checkout is off
 * DONOR_COMMIT), so any parity finding must be re-verified before assuming our
 * recipe is the thing that is wrong. Without this guard the hashes rot the same
 * way the original 'TBD' placeholders did.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DONOR_COMMIT, DONOR_REGISTRY_PATH, manifest } from '../conversion/manifest.ts';

/** Override with SHADCN_DONOR_ROOT to point at a checkout elsewhere. */
const DONOR_ROOT =
  process.env.SHADCN_DONOR_ROOT ?? join(homedir(), 'Documents', 'GitHub', 'shadcn-ui');

const registryDir = join(DONOR_ROOT, DONOR_REGISTRY_PATH);
const hasDonorCheckout = existsSync(registryDir);

const SETUP = `  git clone https://github.com/shadcn-ui/ui.git ~/Documents/GitHub/shadcn-ui
  git -C ~/Documents/GitHub/shadcn-ui checkout ${DONOR_COMMIT}
  (or set SHADCN_DONOR_ROOT to an existing checkout)`;

// Skipping on absence alone would make this suite green everywhere the donor
// is not cloned, which is every CI runner: the pin would rot exactly the way
// the original 'TBD' placeholders did. Absence is only tolerated when a human
// opts out explicitly.
const optedOut = process.env.SHADCN_DONOR_OPTIONAL === '1';
if (!hasDonorCheckout && optedOut) {
  console.warn(
    `[donor-pin] no shadcn checkout at ${registryDir}; suite skipped by opt-out.\n${SETUP}`,
  );
}

/** First 16 hex of sha256, matching `shasum -a 256 | cut -c1-16`. */
function contentHashOf(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);
}

describe('donor pin', () => {
  it('every entry is pinned to DONOR_COMMIT', () => {
    for (const entry of manifest) {
      expect(entry.upstream.registryVersion, `${entry.component} is pinned elsewhere`).toBe(
        DONOR_COMMIT,
      );
    }
  });

  it('every entry records a real content hash', () => {
    for (const entry of manifest) {
      expect(entry.upstream.contentHash, `${entry.component} has a placeholder hash`).toMatch(
        /^[0-9a-f]{16}$/,
      );
    }
  });

  it('has a donor checkout to verify against', () => {
    expect(
      hasDonorCheckout || optedOut,
      `no shadcn checkout at ${registryDir}. The pin cannot be verified without one.\n${SETUP}\n  (or set SHADCN_DONOR_OPTIONAL=1 to skip deliberately)`,
    ).toBe(true);
  });

  it('the checkout sits at DONOR_COMMIT', () => {
    if (!hasDonorCheckout) return;
    // hashes alone would pass against a set regenerated from a drifted tree
    const head = execFileSync('git', ['-C', DONOR_ROOT, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    expect(head, `donor checkout is at ${head}, not the pinned ${DONOR_COMMIT}`).toBe(DONOR_COMMIT);
  });

  describe.skipIf(!hasDonorCheckout)('against the pinned checkout', () => {
    it.each(manifest.map((e) => [e.component, e.upstream.registryItem, e.upstream.contentHash]))(
      '%s matches its donor source',
      (component, registryItem, expected) => {
        const file = join(registryDir, `${registryItem}.tsx`);
        expect(existsSync(file), `${component}: donor source missing at ${file}`).toBe(true);
        expect(
          contentHashOf(file),
          `${component}: donor source changed. Confirm the checkout is at ${DONOR_COMMIT}; if it is, the donor moved and the conversion needs re-review before the hash is updated.`,
        ).toBe(expected);
      },
    );
  });
});
