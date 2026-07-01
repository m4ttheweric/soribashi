/**
 * CSS Parity Test
 *
 * Runs the CSS parity audit logic and asserts that there are no unexpected
 * DECL_DIFF or MISSING_IN_SORIBASHI findings. Known-intentional divergences
 * are recorded in css-parity-allowlist.ts and excluded from failure.
 *
 * To update the allowlist after fixing a bug:
 *   1. Remove the entry from ALLOWLIST in css-parity-allowlist.ts
 *   2. Re-run the tests — this test should pass (the finding is gone)
 *
 * To add a new intentional divergence:
 *   1. Add an entry to ALLOWLIST with a clear reason and ledgerRef
 *   2. Re-run the tests — this test should pass
 */

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MANTINE_ROOT, runAudit } from '../scripts/css-parity-audit.ts';
import { ALLOWLIST, buildAllowlistSet, makeFindingKey } from './css-parity-allowlist.ts';

// The audit diffs against a local Mantine checkout (override via the
// MANTINE_ROOT env var). Without one, parseCssFile returns [] for every
// upstream file and the audit passes vacuously while the count canaries
// fail with misleading messages, so skip the whole suite instead.
const hasMantineCheckout = existsSync(MANTINE_ROOT);
if (!hasMantineCheckout) {
  console.warn(
    `[css-parity] Mantine checkout not found at ${MANTINE_ROOT}; skipping parity suite. ` +
      'Set MANTINE_ROOT to a mantine@63dafbbf checkout to run it.',
  );
}

describe.skipIf(!hasMantineCheckout)('CSS parity: soribashi blocks vs. Mantine', () => {
  // Run the audit once for all assertions
  const summaries = runAudit();
  const allowlistSet = buildAllowlistSet(ALLOWLIST);

  it('produces audit results for all 14 blocks', () => {
    expect(summaries).toHaveLength(14);
    const blockNames = summaries.map((s) => s.block);
    expect(blockNames).toContain('Box');
    expect(blockNames).toContain('Stack');
    expect(blockNames).toContain('Group');
    expect(blockNames).toContain('Flex');
    expect(blockNames).toContain('Grid');
    expect(blockNames).toContain('GridCol');
    expect(blockNames).toContain('SimpleGrid');
    expect(blockNames).toContain('Container');
    expect(blockNames).toContain('Center');
    expect(blockNames).toContain('AspectRatio');
    expect(blockNames).toContain('Space');
    expect(blockNames).toContain('Paper');
    expect(blockNames).toContain('Text');
    expect(blockNames).toContain('Title');
  });

  it('has no unexpected DECL_DIFF findings', () => {
    const unexpected: string[] = [];
    for (const summary of summaries) {
      for (const finding of summary.findings) {
        if (finding.kind !== 'DECL_DIFF') continue;
        const key = makeFindingKey(finding.block, finding.kind, finding.mantineSelector);
        if (!allowlistSet.has(key)) {
          unexpected.push(
            `[${finding.block}] DECL_DIFF on "${finding.mantineSelector}": ${finding.snippet.slice(0, 200)}`,
          );
        }
      }
    }
    if (unexpected.length > 0) {
      throw new Error(
        `Unexpected DECL_DIFF findings — add to allowlist or fix the CSS:\n\n${unexpected.join('\n\n')}`,
      );
    }
  });

  it('has no unexpected MISSING_IN_SORIBASHI findings', () => {
    const unexpected: string[] = [];
    for (const summary of summaries) {
      for (const finding of summary.findings) {
        if (finding.kind !== 'MISSING_IN_SORIBASHI') continue;
        const key = makeFindingKey(finding.block, finding.kind, finding.mantineSelector);
        if (!allowlistSet.has(key)) {
          unexpected.push(
            `[${finding.block}] MISSING_IN_SORIBASHI: "${finding.mantineSelector}"\n  ${finding.snippet.slice(0, 200)}`,
          );
        }
      }
    }
    if (unexpected.length > 0) {
      throw new Error(
        `Unexpected MISSING_IN_SORIBASHI findings — add to allowlist or fix the CSS:\n\n${unexpected.join('\n\n')}`,
      );
    }
  });

  it('reports IDENTICAL or TOKEN_DIFF for core Mantine rules on clean blocks', () => {
    // These blocks should be perfectly clean (no DECL_DIFF or MISSING)
    const cleanBlocks = ['Stack', 'Group', 'Center', 'AspectRatio', 'GridCol'];
    for (const blockName of cleanBlocks) {
      const summary = summaries.find((s) => s.block === blockName);
      expect(summary, `should have summary for ${blockName}`).toBeDefined();
      if (!summary) continue;
      expect(summary.DECL_DIFF, `${blockName} should have no DECL_DIFF`).toBe(0);
      expect(summary.MISSING_IN_SORIBASHI, `${blockName} should have no MISSING_IN_SORIBASHI`).toBe(
        0,
      );
    }
  });

  it('Stack has exactly one IDENTICAL rule', () => {
    const stack = summaries.find((s) => s.block === 'Stack');
    expect(stack?.IDENTICAL).toBe(1);
  });

  it('AspectRatio has exactly three IDENTICAL rules', () => {
    const ar = summaries.find((s) => s.block === 'AspectRatio');
    expect(ar?.IDENTICAL).toBe(3);
  });

  it('Group has exactly two IDENTICAL rules (root + nested grow)', () => {
    const group = summaries.find((s) => s.block === 'Group');
    expect(group?.IDENTICAL).toBe(2);
  });

  it('allowlist entries all correspond to real findings (no stale entries)', () => {
    const realFindingKeys = new Set<string>();
    for (const summary of summaries) {
      for (const finding of summary.findings) {
        if (
          finding.kind === 'DECL_DIFF' ||
          finding.kind === 'MISSING_IN_SORIBASHI' ||
          finding.kind === 'EXTRA_IN_SORIBASHI' ||
          finding.kind === 'TOKEN_DIFF'
        ) {
          realFindingKeys.add(makeFindingKey(finding.block, finding.kind, finding.mantineSelector));
        }
      }
    }

    const stale: string[] = [];
    for (const entry of ALLOWLIST) {
      const key = makeFindingKey(entry.block, entry.kind, entry.mantineSelector);
      if (!realFindingKeys.has(key)) {
        stale.push(`${key} — not found in current audit output`);
      }
    }

    if (stale.length > 0) {
      throw new Error(
        `Stale allowlist entries (no longer reported by audit). Remove them:\n\n${stale.join('\n')}`,
      );
    }
  });
});
