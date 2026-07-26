/**
 * Pure classification data for the contrast-matrix guard (matrix-guard.test.ts,
 * node tier). Deliberately holds NO render-bearing content: this module must
 * be importable from the node tier without pulling recipe CSS or React into
 * that tier, so every recipe's actual rendered scenarios (the Button grid,
 * and the `SMALL_COVERAGE` record for everything smaller than a full grid)
 * live in contrast-matrix.test.tsx (browser tier) instead. `SMALL_COVERAGE_NAMES`
 * below is the seam between the two: contrast-matrix.test.tsx asserts
 * `Object.keys(SMALL_COVERAGE)` equals this array, so the two definitions
 * cannot silently drift apart.
 */

/**
 * `'covered'`: the recipe has real rendered contrast cells (either Button's
 * 300-cell intent x variant x size grid, or a `SMALL_COVERAGE` entry).
 * `{ exempt: string }`: the recipe has no contrast cells and a stated reason
 * why (e.g. it renders no text of its own). See matrix-guard.test.ts for the
 * mechanical checks this classification is held to.
 */
export type MatrixClassification = 'covered' | { exempt: string };

/** EVERY manifest recipe must appear here; the guard fails by name otherwise. */
export const MATRIX_CLASSIFICATION: Record<string, MatrixClassification> = {
  Alert: 'covered',
  AspectRatio: { exempt: 'geometry only' },
  Badge: 'covered',
  Box: { exempt: 'no colour of its own; style-prop colours are consumer input' },
  Button: 'covered',
  Center: { exempt: 'geometry only' },
  Checkbox: 'covered',
  Container: { exempt: 'geometry only' },
  Grid: { exempt: 'geometry only' },
  Group: { exempt: 'geometry only' },
  Paper: 'covered',
  Popover: 'covered',
  Stack: { exempt: 'geometry only' },
  Text: 'covered',
  Title: 'covered',
};

/**
 * Names contrast-matrix.test.tsx actually renders `SMALL_COVERAGE` cells for.
 * A `'covered'` classification above is only legitimate for `'Button'` (the
 * grid) or a name in this list; matrix-guard.test.ts enforces that pairing
 * without importing contrast-matrix.test.tsx itself.
 */
export const SMALL_COVERAGE_NAMES: readonly string[] = [
  'Checkbox',
  'Paper',
  'Popover',
  'Text',
  'Title',
];
