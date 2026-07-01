/**
 * CSS Parity Audit: soribashi blocks vs. Mantine source
 *
 * Compares each block's CSS file against its Mantine counterpart and produces
 * a Markdown report at docs/superpowers/audits/2026-04-25-css-parity.md
 *
 * Usage:
 *   bunx tsx packages/blocks/scripts/css-parity-audit.ts
 *   bun run packages/blocks/scripts/css-parity-audit.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SORIBASHI_ROOT = join(__dirname, '..', '..', '..');
const MANTINE_ROOT = '/Users/matt/Documents/GitHub/mantine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FindingKind =
  | 'IDENTICAL'
  | 'TOKEN_DIFF'
  | 'SELECTOR_DIFF'
  | 'DECL_DIFF'
  | 'MISSING_IN_SORIBASHI'
  | 'EXTRA_IN_SORIBASHI';

export interface Declaration {
  property: string;
  value: string;
}

export interface CssRule {
  /** Normalized selector string */
  selector: string;
  declarations: Declaration[];
  /** Original line number in source file (1-based, approximate) */
  lineStart?: number;
  /** Raw selector as written in source */
  rawSelector?: string;
}

export interface Finding {
  block: string;
  kind: FindingKind;
  mantineSelector: string;
  soribashiSelector?: string;
  mantineDecls?: Declaration[];
  soribashiDecls?: Declaration[];
  /** Human-readable diff snippet */
  snippet: string;
  soribashiLine?: number;
}

export interface BlockSummary {
  block: string;
  IDENTICAL: number;
  TOKEN_DIFF: number;
  SELECTOR_DIFF: number;
  DECL_DIFF: number;
  MISSING_IN_SORIBASHI: number;
  EXTRA_IN_SORIBASHI: number;
  findings: Finding[];
}

// ---------------------------------------------------------------------------
// Token substitution table (§ 4 of the adaptation spec)
// ---------------------------------------------------------------------------

const TOKEN_MAP: Record<string, string> = {
  // spacing
  '--mantine-spacing-': '--spacing-',
  // colors
  '--mantine-color-body': '--surface-default',
  '--mantine-color-text': '--text-default',
  '--mantine-color-': '--color-',
  // radius
  '--mantine-radius-default': '--radius-md',
  '--mantine-radius-': '--radius-',
  // font sizes
  '--mantine-font-size-': '--font-size-',
  // line heights
  '--mantine-line-height-': '--line-height-',
  // font weights
  '--mantine-font-weight-': '--font-weight-',
  // font families
  '--mantine-font-family-headings': '--font-family-heading',
  '--mantine-font-family-monospace': '--font-family-mono',
  '--mantine-font-family': '--font-family-sans',
  // shadows
  '--mantine-shadow-': '--shadow-',
  // heading text-wrap (Mantine emits this as --mantine-heading-text-wrap)
  '--mantine-heading-text-wrap': '--heading-text-wrap',
};

// Color map — Mantine uses named shades like gray-3, dark-4.
// These have no direct soribashi equivalent — we map to neutral-* by convention.
const COLOR_FAMILY_MAP: Record<string, string> = {
  'gray-3': 'neutral-300',
  'gray-4': 'neutral-400',
  'dark-4': 'neutral-700',
  'dark-5': 'neutral-800',
};

function normalizeToken(value: string): string {
  let v = value;
  // Apply specific color family mappings first
  for (const [mantineColor, sbColor] of Object.entries(COLOR_FAMILY_MAP)) {
    v = v.replace(
      new RegExp(`--mantine-color-${mantineColor.replace('-', '\\-')}`, 'g'),
      `--color-${sbColor}`,
    );
  }
  // Apply prefix replacements in specificity order (longer first)
  for (const [mantineToken, sbToken] of Object.entries(TOKEN_MAP)) {
    // Escape for regex
    const escaped = mantineToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    v = v.replace(new RegExp(escaped, 'g'), sbToken);
  }
  return v;
}

// ---------------------------------------------------------------------------
// rem() helper normalization
// Mantine postcss: rem(1px) -> 1px literal or 0.0625rem
// We accept both the literal px form and the rem equivalent.
// ---------------------------------------------------------------------------

function normalizeRemHelper(value: string): string {
  // rem(Npx) → either raw Npx (soribashi uses 1px for borders) or N/16 rem
  // We convert rem(1px) to 1px (the soribashi form)
  return value.replace(/rem\((\d+(?:\.\d+)?)px\)/g, (_m, n) => {
    const num = Number.parseFloat(n);
    if (num === 1) return '1px';
    return `${num / 16}rem`;
  });
}

// ---------------------------------------------------------------------------
// Selector normalization
// .mantine-X-Y  <->  .sb-X-Y
// [data-mantine-color-scheme='dark'] <-> .dark
// @mixin light/dark expansion is handled at parse time
// ---------------------------------------------------------------------------

/** Normalize attribute selector quotes to double-quotes for consistent comparison */
function normalizeQuotes(sel: string): string {
  // Replace single-quoted attribute values with double-quoted
  // e.g. [dir='rtl'] → [dir="rtl"], [data-foo='bar'] → [data-foo="bar"]
  return sel.replace(/\[([^\]]*?)'([^']*?)'\]/g, '[$1"$2"]');
}

function normalizeSelectorForMantine(sel: string): string {
  // Convert .root / .inner / .col / .container class names to their
  // normalized abstract form — we use the CLASS NAME as the key, not the
  // mantine- prefix (since Mantine CSS modules use bare .root etc.)
  return normalizeQuotes(sel.trim());
}

function normalizeSelectorForSoribashi(sel: string, blockName: string): string {
  // Strip the .sb-BlockName- prefix to get the abstract part
  // e.g. ".sb-Stack-root" -> ".root"
  //      ".sb-Stack-root:where([data-grow])" -> ".root:where([data-grow])"
  //      ".sb-Stack-root:where([data-grow]) > *" -> ".root:where([data-grow]) > *"
  const prefix = `.sb-${blockName}-`;
  let s = normalizeQuotes(sel.trim());
  if (s.includes(prefix)) {
    s = s.replace(new RegExp(`\\.sb-${blockName}-`, 'g'), '.');
  }
  // .dark .sb-X-root → :root/.dark form
  // We handle this in comparisons
  return s;
}

// ---------------------------------------------------------------------------
// Lightweight CSS parser
//
// Handles:
//   - Regular rules with declarations
//   - Nested rules (& nesting, PostCSS-style)
//   - @media, @container blocks
//   - @mixin light { ... } and @mixin dark { ... }
//   - Comments (stripped)
//   - CSS custom properties (--foo: value)
// ---------------------------------------------------------------------------

interface ParsedBlock {
  type: 'rule' | 'atrule';
  selector?: string;
  atKeyword?: string;
  atCondition?: string;
  declarations: Declaration[];
  children: ParsedBlock[];
  lineStart: number;
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Parse CSS into a tree of ParsedBlocks.
 *
 * Strategy: character-by-character scan building a stack. Each time we
 * encounter `{` we push a new frame; on `}` we pop and attach to parent.
 * Content between `{...}` is split into:
 *   - Pending text that precedes the next `{` → becomes the selector of a new frame
 *   - Text that ends with `;` (or is the last text before `}`) → becomes a declaration
 *
 * Key insight: pending text between the last `;` (or `{`) and the next `{` is
 * a SELECTOR, not a declaration. Pending text followed by `;` is a declaration.
 */
function parseCssBlocks(css: string): ParsedBlock[] {
  const cleaned = stripComments(css);
  const blocks: ParsedBlock[] = [];

  interface StackFrame {
    selector?: string;
    atKeyword?: string;
    atCondition?: string;
    declarations: Declaration[];
    children: ParsedBlock[];
    lineStart: number;
  }

  // Root frame collects top-level blocks
  const root: StackFrame = { declarations: [], children: blocks, lineStart: 1 };
  const stack: StackFrame[] = [root];

  let i = 0;
  let lineNum = 1;
  let pending = ''; // text accumulated since last ; { }
  const pendingLine = 1; // line number when pending started

  function flushDeclaration(text: string, frame: StackFrame) {
    const t = text.trim();
    if (!t) return;
    // Find first colon not inside parentheses
    let depth = 0;
    let colonPos = -1;
    for (let ci = 0; ci < t.length; ci++) {
      const c = t[ci];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (c === ':' && depth === 0) {
        colonPos = ci;
        break;
      }
    }
    if (colonPos <= 0) return;
    const prop = t.slice(0, colonPos).trim();
    const val = t.slice(colonPos + 1).trim();
    // Must look like a CSS property: letters, digits, hyphens, no spaces
    // CSS custom properties: --foo-bar
    if (/^-?-?[a-zA-Z][a-zA-Z0-9-]*$/.test(prop) || /^--/.test(prop)) {
      frame.declarations.push({
        property: prop,
        value: val.replace(/;$/, '').trim(),
      });
    }
  }

  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (ch === '\n') {
      lineNum++;
      pending += ch;
      i++;
    } else if (ch === '{') {
      // pending text is the selector (or at-rule head) for the new block
      const head = pending.trim();
      pending = '';
      const frame: StackFrame = {
        declarations: [],
        children: [],
        lineStart: lineNum,
      };
      if (head.startsWith('@')) {
        const spaceIdx = head.search(/\s/);
        frame.atKeyword = spaceIdx === -1 ? head : head.slice(0, spaceIdx);
        frame.atCondition = spaceIdx === -1 ? '' : head.slice(spaceIdx + 1).trim();
      } else {
        frame.selector = head;
      }
      // Determine type now
      stack.push(frame);
      i++;
    } else if (ch === '}') {
      // Flush any pending text as a declaration (last decl without ;)
      const parent = stack[stack.length - 1];
      if (parent) flushDeclaration(pending, parent);
      pending = '';

      const frame = stack.pop();
      if (frame && frame !== root) {
        const parentFrame = stack[stack.length - 1];
        if (parentFrame) {
          const block: ParsedBlock = {
            type: frame.selector !== undefined ? 'rule' : 'atrule',
            selector: frame.selector,
            atKeyword: frame.atKeyword,
            atCondition: frame.atCondition,
            declarations: frame.declarations,
            children: frame.children,
            lineStart: frame.lineStart,
          };
          parentFrame.children.push(block);
        }
      }
      i++;
    } else if (ch === ';') {
      // Flush pending as a declaration
      const frame = stack[stack.length - 1];
      if (frame) flushDeclaration(pending, frame);
      pending = '';
      i++;
    } else {
      pending += ch;
      i++;
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Flatten nested blocks into a list of CssRule objects with resolved selectors
// ---------------------------------------------------------------------------

/**
 * Expand @mixin light / @mixin dark into :root / .dark pseudo-selectors
 * so they can be compared against soribashi's :root / .dark forms.
 */
function expandMixins(blocks: ParsedBlock[], parentSelector = ''): CssRule[] {
  const rules: CssRule[] = [];

  for (const block of blocks) {
    if (block.type === 'rule' && block.selector !== undefined) {
      const rawSel = block.selector.trim();
      // Resolve nesting: & is replaced by parentSelector
      let resolvedSel: string;
      if (rawSel.includes('&')) {
        if (parentSelector) {
          resolvedSel = rawSel.replace(/&/g, parentSelector);
        } else {
          resolvedSel = rawSel.replace(/&\s*/g, '').trim();
        }
      } else {
        resolvedSel = parentSelector ? `${parentSelector} ${rawSel}` : rawSel;
      }

      // Add this rule itself if it has declarations
      if (block.declarations.length > 0) {
        rules.push({
          selector: resolvedSel,
          rawSelector: rawSel,
          declarations: block.declarations.map((d) => ({
            property: d.property,
            value: normalizeRemHelper(d.value),
          })),
          lineStart: block.lineStart,
        });
      }

      // Recurse into children
      if (block.children.length > 0) {
        rules.push(...expandMixins(block.children, resolvedSel));
      }
    } else if (block.type === 'atrule') {
      const keyword = block.atKeyword ?? '';
      const condition = block.atCondition ?? '';

      if (keyword === '@mixin') {
        // @mixin light → :root equivalent (scoped to parent selector)
        // @mixin dark → .dark equivalent
        if (condition === 'light') {
          // treat as :root { parent-selector declarations }
          // In Mantine this means "in light mode, these custom properties apply"
          // Soribashi equivalent: :root .sb-X-root { --var: val }
          // For our comparison, we'll mark these as light-mode scoping
          const lightSel = parentSelector ? `:root ${parentSelector}` : ':root';
          if (block.declarations.length > 0) {
            rules.push({
              selector: lightSel,
              rawSelector: '@mixin light',
              declarations: block.declarations.map((d) => ({
                property: d.property,
                value: normalizeRemHelper(normalizeToken(d.value)),
              })),
              lineStart: block.lineStart,
            });
          }
          rules.push(...expandMixins(block.children, parentSelector));
        } else if (condition === 'dark') {
          const darkSel = parentSelector ? `.dark ${parentSelector}` : '.dark';
          if (block.declarations.length > 0) {
            rules.push({
              selector: darkSel,
              rawSelector: '@mixin dark',
              declarations: block.declarations.map((d) => ({
                property: d.property,
                value: normalizeRemHelper(normalizeToken(d.value)),
              })),
              lineStart: block.lineStart,
            });
          }
          rules.push(...expandMixins(block.children, parentSelector));
        } else if (condition.startsWith('where-rtl')) {
          // @mixin where-rtl — RTL mode, skip for this comparison
          // (soribashi doesn't implement RTL variants in the same way)
          // Mark as a special form
          const rtlSel = parentSelector ? `[dir="rtl"] ${parentSelector}` : '[dir="rtl"]';
          if (block.declarations.length > 0) {
            rules.push({
              selector: rtlSel,
              rawSelector: '@mixin where-rtl',
              declarations: block.declarations.map((d) => ({
                property: d.property,
                value: normalizeRemHelper(normalizeToken(d.value)),
              })),
              lineStart: block.lineStart,
            });
          }
        } else if (condition.startsWith('smaller-than(')) {
          // @mixin smaller-than(N) → @media (max-width: ...)
          const match = condition.match(/smaller-than\((\d+)\)/);
          if (match) {
            const px = Number.parseInt(match[1] ?? '0', 10);
            const mediaSel = `@media (max-width: ${px - 1}px)`;
            for (const child of block.children) {
              if (child.type === 'rule' && child.selector) {
                const resolved = child.selector.includes('&')
                  ? child.selector.replace(/&/g, parentSelector)
                  : `${parentSelector} ${child.selector}`;
                if (child.declarations.length > 0) {
                  rules.push({
                    selector: `${mediaSel} > ${resolved}`,
                    rawSelector: `${condition}`,
                    declarations: child.declarations.map((d) => ({
                      property: d.property,
                      value: normalizeRemHelper(normalizeToken(d.value)),
                    })),
                    lineStart: child.lineStart,
                  });
                }
              }
            }
          }
        }
      } else if (keyword === '@media' || keyword === '@container') {
        // Recurse into @media / @container
        const atSel = `${keyword} ${condition}`;
        for (const child of block.children) {
          if (child.type === 'rule') {
            const childRules = expandMixins([child], parentSelector);
            for (const r of childRules) {
              rules.push({
                ...r,
                selector: `${atSel} > ${r.selector}`,
              });
            }
          }
        }
      }
    }
  }

  return rules;
}

// ---------------------------------------------------------------------------
// Parse a CSS file into normalized CssRule[]
// ---------------------------------------------------------------------------

function parseCssFile(filePath: string): CssRule[] {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf-8');
  const blocks = parseCssBlocks(content);
  return expandMixins(blocks);
}

// ---------------------------------------------------------------------------
// Normalize a set of rules for comparison
// ---------------------------------------------------------------------------

function normalizeMantineRules(rules: CssRule[], blockName: string): Map<string, CssRule> {
  const map = new Map<string, CssRule>();
  for (const rule of rules) {
    // Normalize tokens in declarations
    const normalizedDecls = rule.declarations.map((d) => ({
      property: d.property,
      value: normalizeToken(d.value),
    }));
    // Normalize the selector: .root -> .root (keep as-is for Mantine)
    // but expand :root / .dark mixin equivalents
    const normalizedSel = normalizeSelectorForMantine(rule.selector);
    const key = normalizedSel;
    // If multiple rules map to same selector, merge declarations
    const existing = map.get(key);
    if (existing) {
      existing.declarations.push(...normalizedDecls);
    } else {
      map.set(key, { ...rule, declarations: normalizedDecls });
    }
  }
  return map;
}

function normalizeSoribashiRules(rules: CssRule[], blockName: string): Map<string, CssRule> {
  const map = new Map<string, CssRule>();
  for (const rule of rules) {
    // Convert soribashi selector to abstract form for comparison
    const abstractSel = normalizeSelectorForSoribashi(rule.selector, blockName);
    const existing = map.get(abstractSel);
    if (existing) {
      existing.declarations.push(...rule.declarations);
    } else {
      map.set(abstractSel, { ...rule, selector: abstractSel });
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Declaration-level comparison
// ---------------------------------------------------------------------------

function declsEqual(a: Declaration[], b: Declaration[]): boolean {
  if (a.length !== b.length) return false;
  const bMap = new Map(b.map((d) => [d.property, d.value]));
  for (const d of a) {
    const bVal = bMap.get(d.property);
    if (bVal === undefined || bVal !== d.value) return false;
  }
  return true;
}

/**
 * Check whether two sets of declarations differ only in token substitution.
 * (i.e., after applying TOKEN_MAP to the Mantine side, they'd match)
 */
function isTokenDiff(mantineDecls: Declaration[], sbDecls: Declaration[]): boolean {
  if (mantineDecls.length !== sbDecls.length) return false;
  const sbMap = new Map(sbDecls.map((d) => [d.property, d.value]));
  for (const d of mantineDecls) {
    const normalized = normalizeToken(d.value);
    const sbVal = sbMap.get(d.property);
    if (sbVal === undefined || sbVal !== normalized) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Block configuration
// ---------------------------------------------------------------------------

interface BlockConfig {
  name: string;
  /** Mantine module CSS paths (relative to MANTINE_ROOT) */
  mantinePaths: string[];
  /** Soribashi CSS path (relative to SORIBASHI_ROOT) */
  soribashiPath: string | null;
}

const BLOCKS: BlockConfig[] = [
  {
    name: 'Box',
    mantinePaths: ['packages/@mantine/core/src/core/Box/Box.module.css'],
    soribashiPath: 'packages/blocks/src/Box/Box.css',
  },
  {
    name: 'Stack',
    mantinePaths: ['packages/@mantine/core/src/components/Stack/Stack.module.css'],
    soribashiPath: 'packages/blocks/src/Stack/Stack.css',
  },
  {
    name: 'Group',
    mantinePaths: ['packages/@mantine/core/src/components/Group/Group.module.css'],
    soribashiPath: 'packages/blocks/src/Group/Group.css',
  },
  {
    name: 'Flex',
    mantinePaths: ['packages/@mantine/core/src/components/Flex/Flex.module.css'],
    soribashiPath: 'packages/blocks/src/Flex/Flex.css',
  },
  {
    name: 'Grid',
    mantinePaths: ['packages/@mantine/core/src/components/Grid/Grid.module.css'],
    soribashiPath: 'packages/blocks/src/Grid/Grid.css',
  },
  {
    name: 'GridCol',
    mantinePaths: [
      // GridCol CSS is inline in Grid.module.css (the .col selector)
      'packages/@mantine/core/src/components/Grid/Grid.module.css',
    ],
    soribashiPath: 'packages/blocks/src/Grid/Grid.css',
  },
  {
    name: 'SimpleGrid',
    mantinePaths: ['packages/@mantine/core/src/components/SimpleGrid/SimpleGrid.module.css'],
    soribashiPath: 'packages/blocks/src/SimpleGrid/SimpleGrid.css',
  },
  {
    name: 'Container',
    mantinePaths: ['packages/@mantine/core/src/components/Container/Container.module.css'],
    soribashiPath: 'packages/blocks/src/Container/Container.css',
  },
  {
    name: 'Center',
    mantinePaths: ['packages/@mantine/core/src/components/Center/Center.module.css'],
    soribashiPath: 'packages/blocks/src/Center/Center.css',
  },
  {
    name: 'AspectRatio',
    mantinePaths: ['packages/@mantine/core/src/components/AspectRatio/AspectRatio.module.css'],
    soribashiPath: 'packages/blocks/src/AspectRatio/AspectRatio.css',
  },
  {
    name: 'Space',
    mantinePaths: [],
    soribashiPath: null, // Space has no CSS file in either Mantine or soribashi
  },
  {
    name: 'Paper',
    mantinePaths: ['packages/@mantine/core/src/components/Paper/Paper.module.css'],
    soribashiPath: 'packages/blocks/src/Paper/Paper.css',
  },
  {
    name: 'Text',
    mantinePaths: ['packages/@mantine/core/src/components/Text/Text.module.css'],
    soribashiPath: 'packages/blocks/src/Text/Text.css',
  },
  {
    name: 'Title',
    mantinePaths: ['packages/@mantine/core/src/components/Title/Title.module.css'],
    soribashiPath: 'packages/blocks/src/Title/Title.css',
  },
];

// ---------------------------------------------------------------------------
// Main comparison logic
// ---------------------------------------------------------------------------

function formatDeclDiff(mantineDecls: Declaration[], sbDecls: Declaration[], maxLines = 6): string {
  const lines: string[] = [];
  const sbMap = new Map(sbDecls.map((d) => [d.property, d.value]));
  const mantineMap = new Map(mantineDecls.map((d) => [d.property, d.value]));

  for (const [prop, val] of mantineMap) {
    const sbVal = sbMap.get(prop);
    if (sbVal === undefined) {
      lines.push(`  - mantine: ${prop}: ${val}`);
      lines.push('  + soribashi: (missing)');
    } else if (sbVal !== val) {
      lines.push(`  - mantine: ${prop}: ${val}`);
      lines.push(`  + soribashi: ${prop}: ${sbVal}`);
    }
  }
  for (const [prop, val] of sbMap) {
    if (!mantineMap.has(prop)) {
      lines.push('  - mantine: (missing)');
      lines.push(`  + soribashi: ${prop}: ${val}`);
    }
  }

  return lines.slice(0, maxLines * 2).join('\n');
}

export function auditBlock(config: BlockConfig): BlockSummary {
  const { name } = config;

  const summary: BlockSummary = {
    block: name,
    IDENTICAL: 0,
    TOKEN_DIFF: 0,
    SELECTOR_DIFF: 0,
    DECL_DIFF: 0,
    MISSING_IN_SORIBASHI: 0,
    EXTRA_IN_SORIBASHI: 0,
    findings: [],
  };

  // Space has no CSS at all — this is intentional (uses Box style props)
  if (config.mantinePaths.length === 0 && config.soribashiPath === null) {
    summary.findings.push({
      block: name,
      kind: 'EXTRA_IN_SORIBASHI',
      mantineSelector: '(none)',
      snippet:
        'Space: no CSS file in either Mantine or soribashi — Space is implemented as a Box wrapper. This is intentional.',
    });
    summary.EXTRA_IN_SORIBASHI += 1;
    return summary;
  }

  // Parse Mantine CSS
  const mantineRules: CssRule[] = [];
  for (const relPath of config.mantinePaths) {
    const fullPath = join(MANTINE_ROOT, relPath);
    mantineRules.push(...parseCssFile(fullPath));
  }

  // Parse soribashi CSS
  const soribashiRules: CssRule[] = config.soribashiPath
    ? parseCssFile(join(SORIBASHI_ROOT, config.soribashiPath))
    : [];

  // Grid and GridCol share the same CSS file — for GridCol audit we only
  // care about the .col selector and ignore .root/.inner/.container
  let filteredMantineRules = mantineRules;
  let filteredSoribashiRules = soribashiRules;

  if (name === 'GridCol') {
    filteredMantineRules = mantineRules.filter((r) => r.selector.includes('.col'));
    filteredSoribashiRules = soribashiRules.filter((r) => r.selector.includes('col'));
    // Use 'Grid' as the prefix for selector normalization since they share the file
  }

  // Build lookup maps
  // For GridCol, use 'Grid' as block name for selector normalization (same file)
  const normBlockName = name === 'GridCol' ? 'Grid' : name;

  const mantineMap = normalizeMantineRules(filteredMantineRules, normBlockName);
  const sbMap = normalizeSoribashiRules(filteredSoribashiRules, normBlockName);

  // Track which soribashi selectors we've matched
  const matchedSb = new Set<string>();

  // For each Mantine rule, find the corresponding soribashi rule
  for (const [mantineSel, mantineRule] of mantineMap) {
    // Build the expected soribashi selector key
    // Mantine selector: ".root" → soribashi abstract: ".root"
    // Mantine selector: ".root:where([data-grow]) > *" → soribashi: ".root:where([data-grow]) > *"
    // Mantine selector: ":root .root" (from @mixin light) → soribashi: ":root .sb-X-root" → abstract ".sb-Paper-root" format
    // Mantine selector: ".dark .root" (from @mixin dark) → soribashi: ".dark .root"

    const sbRule = sbMap.get(mantineSel);

    if (sbRule) {
      matchedSb.add(mantineSel);

      // Compare declarations
      if (declsEqual(mantineRule.declarations, sbRule.declarations)) {
        summary.IDENTICAL += 1;
        summary.findings.push({
          block: name,
          kind: 'IDENTICAL',
          mantineSelector: mantineSel,
          soribashiSelector: mantineSel,
          mantineDecls: mantineRule.declarations,
          soribashiDecls: sbRule.declarations,
          snippet: '',
        });
      } else if (isTokenDiff(mantineRule.declarations, sbRule.declarations)) {
        summary.TOKEN_DIFF += 1;
        summary.findings.push({
          block: name,
          kind: 'TOKEN_DIFF',
          mantineSelector: mantineSel,
          soribashiSelector: mantineSel,
          mantineDecls: mantineRule.declarations,
          soribashiDecls: sbRule.declarations,
          snippet: formatDeclDiff(mantineRule.declarations, sbRule.declarations),
          soribashiLine: sbRule.lineStart,
        });
      } else {
        // Check if it's just a selector specificity difference (same decls, diff selector)
        // This doesn't apply here since we're already matching on selector
        summary.DECL_DIFF += 1;
        summary.findings.push({
          block: name,
          kind: 'DECL_DIFF',
          mantineSelector: mantineSel,
          soribashiSelector: mantineSel,
          mantineDecls: mantineRule.declarations,
          soribashiDecls: sbRule.declarations,
          snippet: formatDeclDiff(mantineRule.declarations, sbRule.declarations),
          soribashiLine: sbRule.lineStart,
        });
      }
    } else {
      // Check if maybe the selector exists but with a different form
      // e.g., Mantine uses :root .root but soribashi uses just .sb-Paper-root
      let foundAlternate = false;

      // Try alternate forms for light/dark scoping
      if (mantineSel.startsWith(':root ')) {
        // Mantine @mixin light → soribashi :root / variable on root selector
        const innerSel = mantineSel.slice(':root '.length);
        // Look for soribashi declaring those vars directly on the root rule
        const rootRule = sbMap.get(innerSel);
        if (rootRule) {
          // Check if the declarations are a subset of the root rule's declarations
          const allPresent = mantineRule.declarations.every((md) => {
            const sbVal = rootRule.declarations.find((sd) => sd.property === md.property);
            return sbVal !== undefined;
          });
          if (allPresent) {
            matchedSb.add(innerSel);
            summary.TOKEN_DIFF += 1;
            summary.findings.push({
              block: name,
              kind: 'TOKEN_DIFF',
              mantineSelector: mantineSel,
              soribashiSelector: innerSel,
              snippet: `@mixin light → declarations found on root selector (${innerSel}) instead of :root scope`,
              soribashiLine: rootRule.lineStart,
            });
            foundAlternate = true;
          }
        }
      } else if (mantineSel.startsWith('.dark ')) {
        // @mixin dark → .dark .sb-X-root
        // Already normalized, just try looking for it
      }

      if (!foundAlternate) {
        summary.MISSING_IN_SORIBASHI += 1;
        summary.findings.push({
          block: name,
          kind: 'MISSING_IN_SORIBASHI',
          mantineSelector: mantineSel,
          mantineDecls: mantineRule.declarations,
          snippet: mantineRule.declarations.map((d) => `  ${d.property}: ${d.value}`).join('\n'),
          soribashiLine: undefined,
        });
      }
    }
  }

  // Find extra soribashi rules (no Mantine equivalent)
  for (const [sbSel, sbRule] of sbMap) {
    if (!matchedSb.has(sbSel)) {
      summary.EXTRA_IN_SORIBASHI += 1;
      summary.findings.push({
        block: name,
        kind: 'EXTRA_IN_SORIBASHI',
        mantineSelector: '(none)',
        soribashiSelector: sbSel,
        soribashiDecls: sbRule.declarations,
        snippet: sbRule.declarations.map((d) => `  ${d.property}: ${d.value}`).join('\n'),
        soribashiLine: sbRule.lineStart,
      });
    }
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Run audit on all blocks
// ---------------------------------------------------------------------------

export function runAudit(): BlockSummary[] {
  return BLOCKS.map(auditBlock);
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function formatSummaryRow(s: BlockSummary): string {
  return (
    `IDENTICAL: ${s.IDENTICAL} / ` +
    `TOKEN_DIFF: ${s.TOKEN_DIFF} / ` +
    `SELECTOR_DIFF: ${s.SELECTOR_DIFF} / ` +
    `DECL_DIFF: ${s.DECL_DIFF} / ` +
    `MISSING: ${s.MISSING_IN_SORIBASHI} / ` +
    `EXTRA: ${s.EXTRA_IN_SORIBASHI}`
  );
}

export function generateReport(summaries: BlockSummary[]): string {
  const lines: string[] = [];

  lines.push('# CSS Parity Audit: soribashi blocks vs. Mantine');
  lines.push('');
  lines.push('**Generated:** 2026-04-25');
  lines.push('**Mantine commit:** `63dafbbf`');
  lines.push('**Script:** `packages/blocks/scripts/css-parity-audit.ts`');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Legend');
  lines.push('');
  lines.push('| Kind | Meaning |');
  lines.push('|------|---------|');
  lines.push('| `IDENTICAL` | Post-normalization, all declarations match |');
  lines.push('| `TOKEN_DIFF` | Declarations differ only in token substitution (per spec § 4) |');
  lines.push('| `SELECTOR_DIFF` | Same declarations, different selector specificity |');
  lines.push('| `DECL_DIFF` | Declaration set differs in a way not explained by tokens |');
  lines.push('| `MISSING_IN_SORIBASHI` | Mantine has a rule with no soribashi equivalent |');
  lines.push('| `EXTRA_IN_SORIBASHI` | soribashi has a rule with no Mantine equivalent |');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Top-level totals
  const totals = {
    IDENTICAL: 0,
    TOKEN_DIFF: 0,
    SELECTOR_DIFF: 0,
    DECL_DIFF: 0,
    MISSING_IN_SORIBASHI: 0,
    EXTRA_IN_SORIBASHI: 0,
  };
  for (const s of summaries) {
    totals.IDENTICAL += s.IDENTICAL;
    totals.TOKEN_DIFF += s.TOKEN_DIFF;
    totals.SELECTOR_DIFF += s.SELECTOR_DIFF;
    totals.DECL_DIFF += s.DECL_DIFF;
    totals.MISSING_IN_SORIBASHI += s.MISSING_IN_SORIBASHI;
    totals.EXTRA_IN_SORIBASHI += s.EXTRA_IN_SORIBASHI;
  }

  lines.push('## Top-level Summary');
  lines.push('');
  lines.push(
    `**Total rules examined:** ${totals.IDENTICAL + totals.TOKEN_DIFF + totals.SELECTOR_DIFF + totals.DECL_DIFF + totals.MISSING_IN_SORIBASHI}  `,
  );
  lines.push(`**IDENTICAL:** ${totals.IDENTICAL}  `);
  lines.push(`**TOKEN_DIFF:** ${totals.TOKEN_DIFF}  `);
  lines.push(`**SELECTOR_DIFF:** ${totals.SELECTOR_DIFF}  `);
  lines.push(`**DECL_DIFF (action required):** ${totals.DECL_DIFF}  `);
  lines.push(`**MISSING_IN_SORIBASHI (action required):** ${totals.MISSING_IN_SORIBASHI}  `);
  lines.push(`**EXTRA_IN_SORIBASHI (additions):** ${totals.EXTRA_IN_SORIBASHI}  `);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Per-block summaries
  lines.push('## Per-Block Summary');
  lines.push('');
  lines.push('| Block | IDENTICAL | TOKEN_DIFF | SELECTOR_DIFF | DECL_DIFF | MISSING | EXTRA |');
  lines.push('|-------|-----------|------------|---------------|-----------|---------|-------|');
  for (const s of summaries) {
    lines.push(
      `| ${s.block} | ${s.IDENTICAL} | ${s.TOKEN_DIFF} | ${s.SELECTOR_DIFF} | ${s.DECL_DIFF} | ${s.MISSING_IN_SORIBASHI} | ${s.EXTRA_IN_SORIBASHI} |`,
    );
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Per-block detail sections — only for non-IDENTICAL findings
  for (const s of summaries) {
    const actionableFindings = s.findings.filter(
      (f) =>
        f.kind === 'DECL_DIFF' ||
        f.kind === 'MISSING_IN_SORIBASHI' ||
        f.kind === 'EXTRA_IN_SORIBASHI' ||
        f.kind === 'TOKEN_DIFF',
    );

    lines.push(`## ${s.block}`);
    lines.push('');
    lines.push(`**Summary:** ${formatSummaryRow(s)}`);
    lines.push('');

    if (actionableFindings.length === 0) {
      lines.push('No findings — all Mantine rules are present and match.');
      lines.push('');
      continue;
    }

    // DECL_DIFF first (most important)
    const declDiffs = s.findings.filter((f) => f.kind === 'DECL_DIFF');
    if (declDiffs.length > 0) {
      lines.push('### DECL_DIFF — declaration mismatches');
      lines.push('');
      lines.push('| Selector | Snippet |');
      lines.push('|----------|---------|');
      for (const f of declDiffs) {
        const snippetOneLine = f.snippet.replace(/\n/g, ' ↵ ');
        lines.push(`| \`${f.mantineSelector}\` | ${snippetOneLine} |`);
      }
      lines.push('');
    }

    // MISSING
    const missing = s.findings.filter((f) => f.kind === 'MISSING_IN_SORIBASHI');
    if (missing.length > 0) {
      lines.push('### MISSING_IN_SORIBASHI');
      lines.push('');
      lines.push('| Mantine selector | Declarations |');
      lines.push('|-----------------|--------------|');
      for (const f of missing) {
        const snippetOneLine = f.snippet.replace(/\n/g, ' ↵ ');
        lines.push(`| \`${f.mantineSelector}\` | ${snippetOneLine} |`);
      }
      lines.push('');
    }

    // TOKEN_DIFF (informational)
    const tokenDiffs = s.findings.filter((f) => f.kind === 'TOKEN_DIFF');
    if (tokenDiffs.length > 0) {
      lines.push('### TOKEN_DIFF — expected token substitutions');
      lines.push('');
      lines.push('| Mantine selector | Soribashi selector | Notes |');
      lines.push('|-----------------|-------------------|-------|');
      for (const f of tokenDiffs) {
        const notes = f.snippet.includes('\n') ? f.snippet.replace(/\n/g, ' ↵ ') : f.snippet;
        lines.push(`| \`${f.mantineSelector}\` | \`${f.soribashiSelector ?? ''}\` | ${notes} |`);
      }
      lines.push('');
    }

    // EXTRA
    const extras = s.findings.filter((f) => f.kind === 'EXTRA_IN_SORIBASHI');
    if (extras.length > 0) {
      lines.push('### EXTRA_IN_SORIBASHI — soribashi additions');
      lines.push('');
      lines.push('| Soribashi selector | Declarations |');
      lines.push('|-------------------|--------------|');
      for (const f of extras) {
        const snippetOneLine = f.snippet.replace(/\n/g, ' ↵ ');
        lines.push(`| \`${f.soribashiSelector ?? '(none)'}\` | ${snippetOneLine} |`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const REPORT_PATH = join(SORIBASHI_ROOT, 'docs/superpowers/audits/2026-04-25-css-parity.md');

function main() {
  console.log('Running CSS parity audit...\n');

  const summaries = runAudit();

  for (const s of summaries) {
    const totalProblems = s.DECL_DIFF + s.MISSING_IN_SORIBASHI;
    const indicator = totalProblems > 0 ? '⚠' : '✓';
    console.log(`  ${indicator} ${s.block.padEnd(12)} ${formatSummaryRow(s)}`);
  }

  const report = generateReport(summaries);
  writeFileSync(REPORT_PATH, report, 'utf-8');
  console.log(`\nReport written to: ${REPORT_PATH}`);

  // Print totals
  const totals = summaries.reduce(
    (acc, s) => ({
      IDENTICAL: acc.IDENTICAL + s.IDENTICAL,
      TOKEN_DIFF: acc.TOKEN_DIFF + s.TOKEN_DIFF,
      SELECTOR_DIFF: acc.SELECTOR_DIFF + s.SELECTOR_DIFF,
      DECL_DIFF: acc.DECL_DIFF + s.DECL_DIFF,
      MISSING_IN_SORIBASHI: acc.MISSING_IN_SORIBASHI + s.MISSING_IN_SORIBASHI,
      EXTRA_IN_SORIBASHI: acc.EXTRA_IN_SORIBASHI + s.EXTRA_IN_SORIBASHI,
    }),
    {
      IDENTICAL: 0,
      TOKEN_DIFF: 0,
      SELECTOR_DIFF: 0,
      DECL_DIFF: 0,
      MISSING_IN_SORIBASHI: 0,
      EXTRA_IN_SORIBASHI: 0,
    },
  );

  console.log('\nTotal findings:');
  console.log(`  IDENTICAL: ${totals.IDENTICAL}`);
  console.log(`  TOKEN_DIFF: ${totals.TOKEN_DIFF}`);
  console.log(`  SELECTOR_DIFF: ${totals.SELECTOR_DIFF}`);
  console.log(`  DECL_DIFF: ${totals.DECL_DIFF}`);
  console.log(`  MISSING_IN_SORIBASHI: ${totals.MISSING_IN_SORIBASHI}`);
  console.log(`  EXTRA_IN_SORIBASHI: ${totals.EXTRA_IN_SORIBASHI}`);

  const problems = totals.DECL_DIFF + totals.MISSING_IN_SORIBASHI;
  if (problems > 0) {
    console.log(`\n⚠  ${problems} finding(s) require attention (DECL_DIFF + MISSING)`);
    process.exit(1);
  } else {
    console.log('\n✓  No critical findings');
    process.exit(0);
  }
}

// Only run main() when executed directly (not when imported as a module in tests)
// ESM: import.meta.url will equal the current file's URL only when run directly
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('css-parity-audit.ts') ||
    process.argv[1].endsWith('css-parity-audit.js'))
) {
  main();
}
