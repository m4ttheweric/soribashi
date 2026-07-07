import { SoribashiProvider, createTheme, registerTheme } from '@soribashi/core';
import { configureClassNameMerge } from '@soribashi/core';
import { render, screen } from '@testing-library/react';
import { twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';
import { theme } from '../../theme/index.ts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card.tsx';

configureClassNameMerge(twMerge);

function wrap(ui: React.ReactElement) {
  return render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);
}

describe('Card part-family', () => {
  it('Card renders with surface + border classes', () => {
    wrap(<Card>Body</Card>);
    const el = screen.getByText('Body');
    expect(el.className).toContain('rounded-xl');
    expect(el.className).toContain('border-(--border-default)');
    expect(el.className).toContain('bg-(--surface-raised)');
  });

  it('CardHeader renders with flex + padding', () => {
    wrap(<CardHeader>Header</CardHeader>);
    const el = screen.getByText('Header');
    expect(el.className).toContain('flex');
    expect(el.className).toContain('flex-col');
    expect(el.className).toContain('p-6');
  });

  it('CardTitle renders as h3', () => {
    wrap(<CardTitle>Title</CardTitle>);
    const el = screen.getByText('Title');
    expect(el.tagName).toBe('H3');
    expect(el.className).toContain('font-semibold');
  });

  it('CardDescription renders with muted text', () => {
    wrap(<CardDescription>Desc</CardDescription>);
    const el = screen.getByText('Desc');
    expect(el.tagName).toBe('P');
    expect(el.className).toContain('text-(--text-muted)');
  });

  it('CardContent renders with padding', () => {
    wrap(<CardContent>Content</CardContent>);
    const el = screen.getByText('Content');
    expect(el.className).toContain('p-6');
    expect(el.className).toContain('pt-0');
  });

  it('CardFooter renders with flex + padding', () => {
    wrap(<CardFooter>Footer</CardFooter>);
    const el = screen.getByText('Footer');
    expect(el.className).toContain('flex');
    expect(el.className).toContain('p-6');
  });

  it('all parts forward refs', () => {
    const refs: Record<string, HTMLElement | null> = {};
    wrap(
      <Card
        ref={(el) => {
          refs.card = el;
        }}
      >
        <CardHeader
          ref={(el) => {
            refs.header = el;
          }}
        >
          <CardTitle
            ref={(el) => {
              refs.title = el;
            }}
          >
            Title
          </CardTitle>
          <CardDescription
            ref={(el) => {
              refs.description = el;
            }}
          >
            Desc
          </CardDescription>
        </CardHeader>
        <CardContent
          ref={(el) => {
            refs.content = el;
          }}
        >
          Content
        </CardContent>
        <CardFooter
          ref={(el) => {
            refs.footer = el;
          }}
        >
          Footer
        </CardFooter>
      </Card>,
    );
    expect(refs.card).toBeInstanceOf(HTMLDivElement);
    expect(refs.header).toBeInstanceOf(HTMLDivElement);
    expect(refs.title).toBeInstanceOf(HTMLHeadingElement);
    expect(refs.description).toBeInstanceOf(HTMLParagraphElement);
    expect(refs.content).toBeInstanceOf(HTMLDivElement);
    expect(refs.footer).toBeInstanceOf(HTMLDivElement);
  });

  it('Card.extend({ classNames }) threads at theme level', () => {
    const custom = createTheme({
      extends: theme,
      components: [Card.extend({ classNames: { root: 'shadow-lg' } })],
    });
    registerTheme(custom);
    render(
      <SoribashiProvider theme={custom}>
        <Card>Themed</Card>
      </SoribashiProvider>,
    );
    expect(screen.getByText('Themed').className).toContain('shadow-lg');
  });

  it('resolves twMerge conflicts on Card', () => {
    wrap(<Card className="border-dashed">Dashed</Card>);
    const el = screen.getByText('Dashed');
    expect(el.className).toContain('border-dashed');
  });
});
