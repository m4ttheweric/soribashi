import { Input as BaseInput } from '@base-ui/react/input';
import { SoribashiProvider } from '@soribashi/core';
import { useContext } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Field, FieldAnatomyContext } from './Field.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx/Popover.test.tsx); `wrap` awaits it so callers get the real
// result object rather than a RenderResult-shaped promise.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Field (browser)', () => {
  it('focuses the control when the label is clicked (real association, not proximity)', async () => {
    const screen = await wrap(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <BaseInput />
      </Field.Root>,
    );
    await screen.getByText('Email').click();
    const input = screen.getByRole('textbox', { name: 'Email' });
    await expect.element(input).toHaveFocus();
  });

  it('associates the description via aria-describedby', async () => {
    const screen = await wrap(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <BaseInput />
        <Field.Description>We never share it.</Field.Description>
      </Field.Root>,
    );
    const input = screen.getByRole('textbox').element() as HTMLInputElement;
    const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(describedText).toContain('We never share it.');
  });

  it('shows a forced error, associates it, and renders it in the danger colour (computed)', async () => {
    const screen = await wrap(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <BaseInput />
        <Field.Description classNames={{ description: 'probe-desc' }}>hint</Field.Description>
        <Field.Error match classNames={{ error: 'probe-err' }}>
          Required
        </Field.Error>
      </Field.Root>,
    );
    await expect.element(screen.getByText('Required')).toBeInTheDocument();
    const err = getComputedStyle(screen.container.querySelector('.probe-err')!).color;
    const desc = getComputedStyle(screen.container.querySelector('.probe-desc')!).color;
    expect(err).not.toBe(desc);
    const input = screen.getByRole('textbox').element() as HTMLInputElement;
    const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const describedText = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(describedText).toContain('Required');
  });

  it('exposes FieldAnatomyContext as true inside Root and false outside', async () => {
    // The composed-mode contract's detection seam (Tasks 5 to 8 warn on it):
    // a control given anatomy convenience props while ALSO nested inside a
    // hand-composed Field.Root would double up the anatomy and break Base
    // UI's label/control association, so a control reads this context and
    // warns in dev when both are present at once.
    const readings: boolean[] = [];
    function Probe({ slot }: { slot: number }) {
      readings[slot] = useContext(FieldAnatomyContext);
      return null;
    }
    await wrap(
      <>
        <Probe slot={0} />
        <Field.Root>
          <Probe slot={1} />
        </Field.Root>
      </>,
    );
    await expect.poll(() => readings).toEqual([false, true]);
  });

  it('data-layout="row" switches the anatomy to a row (computed flex-direction), not just an attribute', async () => {
    // Not one of the brief's four verbatim tests, but the downstream
    // contract Task 7's Switch relies on: the attribute-selector CSS rule
    // (Field.module.css's `.root[data-layout='row']`) must actually take
    // effect on real computed layout, not just be present as an inert
    // attribute (the authoring skill's behavioural-over-emissive rule).
    const column = await wrap(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <BaseInput />
      </Field.Root>,
    );
    const columnRoot = column.container.firstElementChild as HTMLElement;
    expect(getComputedStyle(columnRoot).flexDirection).toBe('column');

    const row = await wrap(
      <Field.Root data-layout="row">
        <Field.Label>Email</Field.Label>
        <BaseInput />
      </Field.Root>,
    );
    const rowRoot = row.container.firstElementChild as HTMLElement;
    expect(rowRoot.getAttribute('data-layout')).toBe('row');
    expect(getComputedStyle(rowRoot).flexDirection).toBe('row');
  });
});
