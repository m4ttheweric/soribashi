/**
 * Type-level proof that defineGenericComponent carries an author-supplied generic
 * signature with real call-site inference (Mantine genericFactory parity).
 * Enforced by `bun run typecheck` (this file is in the root tsconfig). The one
 * runtime `it` exists so vitest does not error on an empty suite; the real
 * assertions are the @ts-expect-error directives, checked at compile time.
 */
import { describe, expect, it } from 'vitest';
import { defineGenericComponent } from '../src/define-generic-component.tsx';

type Primitive = string | number | boolean;
interface Item<V extends Primitive> {
  value: V;
  label: string;
}
interface PickProps<V extends Primitive> {
  data: (V | Item<V>)[];
  onPick?: (v: V) => void;
}
type PickSignature = <const V extends Primitive = string>(
  props: PickProps<V>,
) => React.ReactElement | null;

const Pick = defineGenericComponent<PickSignature>({
  name: 'Pick',
  selectors: ['root'] as const,
  render: ({ props, getStyles, ref }: any) => (
    <ul ref={ref} {...getStyles('root')} data-n={props.data.length} />
  ),
});

describe('defineGenericComponent generic signature inference', () => {
  it('narrows the type parameter from the data prop at the call site', () => {
    // POSITIVE: V narrows to 'sm' | 'md'; onPick arg is that union
    void (
      <Pick
        data={[
          { value: 'sm', label: 'S' },
          { value: 'md', label: 'M' },
        ]}
        onPick={(v) => {
          const ok: 'sm' | 'md' = v;
          void ok;
        }}
      />
    );
    // @ts-expect-error: 'lg' is not in the data union 'sm' | 'md'
    void (<Pick data={[{ value: 'sm', label: 'S' }]} onPick={(v: 'lg') => void v} />);
    // withProps preserves the generic signature
    const Styled = Pick.withProps({});
    void (
      <Styled
        data={[{ value: 1, label: 'one' }]}
        onPick={(v) => {
          const ok: 1 = v;
          void ok;
        }}
      />
    );
    expect(true).toBe(true);
  });
});
