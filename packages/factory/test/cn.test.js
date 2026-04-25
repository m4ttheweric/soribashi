import { describe, expect, it } from 'vitest';
import { cn } from '../src/cn.ts';
describe('cn', () => {
    it('combines string class names', () => {
        expect(cn('a', 'b', 'c')).toBe('a b c');
    });
    it('filters falsy values', () => {
        expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
    });
    it('flattens arrays', () => {
        expect(cn(['a', 'b'], 'c')).toBe('a b c');
    });
    it('handles object syntax (clsx-style)', () => {
        expect(cn({ a: true, b: false, c: true })).toBe('a c');
    });
    it('merges conflicting Tailwind classes (tailwind-merge)', () => {
        expect(cn('px-2', 'px-4')).toBe('px-4');
        expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    });
    it('preserves non-conflicting Tailwind classes', () => {
        expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2');
    });
    it('returns empty string for no inputs', () => {
        expect(cn()).toBe('');
    });
});
//# sourceMappingURL=cn.test.js.map