import {
  SoribashiProvider,
  configureClassNameMerge,
  createTheme,
  registerTheme,
} from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Dialog } from './Dialog.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

describe('Dialog compound', () => {
  it('renders closed by default (content not in the DOM)', () => {
    wrap(
      <Dialog>
        <Dialog.Trigger>
          <button type="button">init-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>init-title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    expect(screen.getByText('init-trigger')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens when defaultOpen is true (content visible)', () => {
    wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">defaultopen-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>defaultopen-title</Dialog.Title>
          <Dialog.Description>defaultopen-description</Dialog.Description>
        </Dialog.Content>
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { name: 'defaultopen-title' })).toBeInTheDocument();
  });

  it('opens on trigger click and closes on escape', async () => {
    const user = userEvent.setup();
    wrap(
      <Dialog>
        <Dialog.Trigger>
          <button type="button">click-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>click-title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    await user.click(screen.getByText('click-trigger'));
    expect(await screen.findByRole('dialog', { name: 'click-title' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'click-title' })).not.toBeInTheDocument();
  });

  it('trigger wraps the child so the trigger element carries the compound styling', () => {
    wrap(
      <Dialog>
        <Dialog.Trigger>
          <button type="button" data-testid="inner-btn">
            trigger
          </button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>tip</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    const btn = screen.getByTestId('inner-btn');
    expect(btn.parentElement?.tagName).toBe('SPAN');
  });

  it('forwards a ref on Dialog.Trigger to the wrapping span', () => {
    let node: HTMLElement | null = null;
    wrap(
      <Dialog>
        <Dialog.Trigger
          ref={(el: HTMLElement | null) => {
            node = el;
          }}
        >
          <button type="button">ref-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>tip</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    expect(node).toBeInstanceOf(HTMLSpanElement);
  });

  it('renders content inside a portal (not inside the test container)', () => {
    const { container } = wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">portal-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>portal-title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('overlay renders with the backdrop class', () => {
    wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">overlay-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>overlay-title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    const overlay = document.body.querySelector('.fixed.inset-0.z-50.bg-black\\/80');
    expect(overlay).not.toBeNull();
  });

  it('Content applies the recipe class', () => {
    wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">class-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>class-title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    const content = screen.getByRole('dialog', { name: 'class-title' });
    expect(content.className).toContain('rounded-lg');
    expect(content.className).toContain('bg-(--surface-raised)');
  });

  it('Title renders as an h2 and Description renders as a p, wired via aria attributes', () => {
    wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">aria-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>aria-title</Dialog.Title>
          <Dialog.Description>aria-description</Dialog.Description>
        </Dialog.Content>
      </Dialog>,
    );

    const content = screen.getByRole('dialog');
    const title = screen.getByText('aria-title');
    const description = screen.getByText('aria-description');

    expect(title.tagName).toBe('H2');
    expect(description.tagName).toBe('P');
    expect(content.getAttribute('aria-labelledby')).toBe(title.id);
    expect(content.getAttribute('aria-describedby')).toBe(description.id);
  });

  it('header and footer are structural parts that render their children', () => {
    wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">structural-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>structural-title</Dialog.Title>
          </Dialog.Header>
          <Dialog.Footer>
            <button type="button">footer-action</button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>,
    );

    expect(screen.getByText('structural-title')).toBeInTheDocument();
    expect(screen.getByText('footer-action')).toBeInTheDocument();
  });

  it('the built-in close button has an X icon and closes the dialog on click', async () => {
    const user = userEvent.setup();
    wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">close-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>close-title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton.querySelector('svg')).not.toBeNull();

    await user.click(closeButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Dialog.Close renders a consumer-facing close trigger distinct from the built-in X button', async () => {
    const user = userEvent.setup();
    wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">consumer-close-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>consumer-close-title</Dialog.Title>
          <Dialog.Footer>
            <Dialog.Close>Cancel</Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>,
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).not.toBe(screen.getByRole('button', { name: 'Close' }));

    await user.click(cancelButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('throws when Dialog.Trigger is rendered outside Dialog', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Dialog.Trigger>
            <button type="button">x</button>
          </Dialog.Trigger>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Dialog\.Trigger> must be inside <Dialog>/);
  });

  it('Dialog.Content className from instance props lands on the rendered element', () => {
    wrap(
      <Dialog defaultOpen>
        <Dialog.Trigger>
          <button type="button">custom-class-trigger</button>
        </Dialog.Trigger>
        <Dialog.Content className="custom-content-class">
          <Dialog.Title>custom-class-title</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    const content = screen.getByRole('dialog');
    expect(content.className).toContain('custom-content-class');
  });

  it('extend-set className for Dialog.Content lands on the element', () => {
    const themeWithDefaults = createTheme({
      extends: theme,
      components: [
        Dialog.Content.extend({ defaultProps: { className: 'theme-default-class' } as never }),
      ],
    });
    registerTheme(themeWithDefaults);
    render(
      <SoribashiProvider theme={themeWithDefaults}>
        <Dialog defaultOpen>
          <Dialog.Trigger>
            <button type="button">wd-trigger</button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>wd-title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      </SoribashiProvider>,
    );

    const content = screen.getByRole('dialog');
    expect(content.className).toContain('theme-default-class');
  });
});
