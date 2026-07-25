import { describe, expect, it } from 'vitest';
import { extractStyleProps } from '../../src/style-props/extract-style-props.ts';
import { STYLE_PROPS_DATA } from '../../src/style-props/style-props-data.ts';

describe('extractStyleProps fast path', () => {
  it('returns the original props object untouched when no style props are present', () => {
    const props = { onClick: () => {}, children: 'x', 'aria-label': 'y' };
    const result = extractStyleProps(props, STYLE_PROPS_DATA);
    expect(result.rest).toBe(props);
    expect(Object.keys(result.styleProps)).toEqual([]);
  });
  it('still splits when a style prop is present', () => {
    const props = { p: 'md', onClick: () => {} };
    const result = extractStyleProps(props, STYLE_PROPS_DATA);
    expect(result.styleProps).toEqual({ p: 'md' });
    expect(result.rest).not.toBe(props);
    expect('p' in result.rest).toBe(false);
  });
});
