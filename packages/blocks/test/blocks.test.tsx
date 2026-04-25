import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import {
  Box,
  Stack,
  Group,
  Flex,
  Grid,
  SimpleGrid,
  Container,
  Center,
  AspectRatio,
  Space,
  Paper,
  Text,
  Title,
} from '../src/index.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Box (smoke — full coverage in test/Box.test.tsx)', () => {
  it('renders div by default', () => {
    const { container } = wrap(<Box>X</Box>);
    expect(container.querySelector('div')).toBeInTheDocument();
    expect((container.querySelector('div') as HTMLElement).className).toContain('sb-Box-root');
  });

  it('respects as prop', () => {
    const { container } = wrap(<Box as="section">X</Box>);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('forwards arbitrary HTML attributes', () => {
    const { container } = wrap(
      <Box id="test" data-foo="bar">
        X
      </Box>,
    );
    const el = container.querySelector('#test') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('data-foo')).toBe('bar');
  });

  it('style props produce inline styles (new Mantine-faithful behavior)', () => {
    const { container } = wrap(
      <Box p="md" bdrs="lg" bg="surface.raised">
        X
      </Box>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.padding).toBe('var(--spacing-md)');
    expect(el.style.borderRadius).toBe('var(--radius-lg)');
    expect(el.style.background).toBe('var(--surface-raised)');
  });
});

describe('Stack', () => {
  it('renders with default md gap (CSS var on style)', () => {
    const { container } = wrap(<Stack>X</Stack>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Stack-root');
    expect(el.style.getPropertyValue('--stack-gap')).toBe('var(--spacing-md)');
  });

  it('applies gap, align, justify as CSS vars', () => {
    const { container } = wrap(
      <Stack gap="lg" align="center" justify="space-between">
        X
      </Stack>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--stack-gap')).toBe('var(--spacing-lg)');
    expect(el.style.getPropertyValue('--stack-align')).toBe('center');
    expect(el.style.getPropertyValue('--stack-justify')).toBe('space-between');
  });

  it('Stack accepts raw CSS values for gap', () => {
    const { container } = wrap(<Stack gap="2.5rem">X</Stack>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--stack-gap')).toBe('2.5rem');
  });
});

describe('Group', () => {
  it('renders with default md gap and wrap (CSS vars)', () => {
    const { container } = wrap(<Group>X</Group>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Group-root');
    expect(el.style.getPropertyValue('--group-gap')).toBe('var(--spacing-md)');
    expect(el.style.getPropertyValue('--group-wrap')).toBe('wrap');
  });

  it('applies wrap=nowrap as CSS var', () => {
    const { container } = wrap(<Group wrap="nowrap">X</Group>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--group-wrap')).toBe('nowrap');
  });

  it('grow=true sets data-grow attribute on root', () => {
    const { container } = wrap(<Group grow>X</Group>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.grow).toBe('true');
  });

  it('preventGrowOverflow computes child width', () => {
    const { container } = wrap(
      <Group grow gap="md">
        <span>a</span>
        <span>b</span>
        <span>c</span>
      </Group>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--group-child-width')).toContain('calc');
    expect(el.style.getPropertyValue('--group-child-width')).toContain('33.333');
  });

  it('filters falsy children when computing childWidth', () => {
    const { container } = wrap(
      <Group grow>
        {true && <span>a</span>}
        {false && <span>nope</span>}
        {null}
        <span>b</span>
      </Group>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--group-child-width')).toContain('50%');
  });
});

describe('Flex', () => {
  it('renders with sb-Flex-root class', () => {
    const { container } = wrap(<Flex>X</Flex>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Flex-root');
  });

  it('direction prop produces --flex-direction CSS var', () => {
    const { container } = wrap(<Flex direction="column">X</Flex>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--flex-direction')).toBe('column');
  });

  it('gap/align/justify produce CSS vars', () => {
    const { container } = wrap(
      <Flex gap="lg" align="center" justify="space-between">
        X
      </Flex>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--flex-gap')).toBe('var(--spacing-lg)');
    expect(el.style.getPropertyValue('--flex-align')).toBe('center');
    expect(el.style.getPropertyValue('--flex-justify')).toBe('space-between');
  });
});

describe('Grid', () => {
  it('renders 12 columns by default with --grid-columns CSS var', () => {
    const { container } = wrap(<Grid>X</Grid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Grid-root');
    expect(el.style.getPropertyValue('--grid-columns')).toBe('12');
  });

  it('Grid.Col is a compound component', () => {
    expect(Grid.Col).toBeDefined();
  });

  it('Grid.Col applies span as CSS vars', () => {
    const { container } = wrap(<Grid.Col span={6}>X</Grid.Col>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Grid-col');
    expect(el.style.getPropertyValue('--col-flex-basis')).toContain('50%');
  });

  it('Grid.Col span="auto" sets flex-grow', () => {
    const { container } = wrap(<Grid.Col span="auto">X</Grid.Col>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--col-flex-grow')).toBe('1');
  });

  it('Grid.Col offset/order/alignSelf produce CSS vars', () => {
    const { container } = wrap(
      <Grid.Col span={4} offset={2} order={3} alignSelf="end">
        X
      </Grid.Col>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.getPropertyValue('--col-offset')).toContain('16.66');
    expect(el.style.getPropertyValue('--col-order')).toBe('3');
    expect(el.style.getPropertyValue('--col-align-self')).toBe('end');
  });
});

describe('SimpleGrid', () => {
  it('renders default cols=1 with --sg-cols CSS var', () => {
    const { container } = wrap(<SimpleGrid>X</SimpleGrid>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-SimpleGrid-root');
    expect(el.style.getPropertyValue('--sg-cols')).toBe('1');
  });

  it('cols prop sets --sg-cols', () => {
    const { container } = wrap(<SimpleGrid cols={3}>X</SimpleGrid>);
    expect(
      (container.querySelector('div') as HTMLElement).style.getPropertyValue('--sg-cols'),
    ).toBe('3');
  });

  it('autoCols=auto-fill sets data-auto-cols attribute', () => {
    const { container } = wrap(
      <SimpleGrid autoCols="auto-fill" minColumnWidth="200px">
        X
      </SimpleGrid>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.dataset.autoCols).toBe('auto-fill');
    expect(el.style.getPropertyValue('--sg-min-col-width')).toBe('200px');
  });
});

describe('Container', () => {
  it('renders lg size by default', () => {
    const { container } = wrap(<Container>X</Container>);
    expect((container.firstChild as HTMLElement).dataset.size).toBe('lg');
  });

  it('respects size prop', () => {
    const { container } = wrap(<Container size="xl">X</Container>);
    expect((container.firstChild as HTMLElement).dataset.size).toBe('xl');
  });
});

describe('Center', () => {
  it('renders without data-inline by default (presence-of-attribute pattern)', () => {
    const { container } = wrap(<Center>X</Center>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Center-root');
    expect(el.dataset.inline).toBeUndefined();
  });

  it('inline prop adds data-inline="true"', () => {
    const { container } = wrap(<Center inline>X</Center>);
    expect((container.querySelector('div') as HTMLElement).dataset.inline).toBe('true');
  });
});

describe('AspectRatio', () => {
  it('renders with default ratio (--ar-ratio CSS var on root)', () => {
    const { container } = wrap(<AspectRatio>X</AspectRatio>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-AspectRatio-root');
    expect(el.style.getPropertyValue('--ar-ratio')).toBe('1');
  });

  it('respects custom ratio', () => {
    const { container } = wrap(<AspectRatio ratio={16 / 9}>X</AspectRatio>);
    expect(
      (container.querySelector('div') as HTMLElement).style.getPropertyValue('--ar-ratio'),
    ).toBe(String(16 / 9));
  });
});

describe('Space', () => {
  it('renders a Box with sizing applied via style props', () => {
    const { container } = wrap(<Space h="md" />);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.nodeName).toBe('DIV');
    expect(el.style.height).toBe('var(--spacing-md)');
  });
});

describe('Paper', () => {
  it('renders with shadow + radius CSS vars when provided', () => {
    const { container } = wrap(
      <Paper shadow="sm" radius="md">
        X
      </Paper>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Paper-root');
    expect(el.style.getPropertyValue('--paper-shadow')).toBe('var(--shadow-sm)');
    expect(el.style.getPropertyValue('--paper-radius')).toBe('var(--radius-md)');
  });

  it('respects withBorder via data-with-border attribute', () => {
    const { container } = wrap(<Paper withBorder>X</Paper>);
    expect((container.querySelector('div') as HTMLElement).dataset.withBorder).toBe('true');
  });
});

describe('Text', () => {
  it('renders p by default', () => {
    const { container } = wrap(<Text>X</Text>);
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('respects as prop', () => {
    const { container } = wrap(<Text as="span">X</Text>);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });

  it('applies size and color', () => {
    const { container } = wrap(
      <Text size="lg" color="muted">
        X
      </Text>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.dataset.size).toBe('lg');
    expect(el.dataset.color).toBe('muted');
  });
});

describe('Title', () => {
  it('renders h1 by default', () => {
    const { container } = wrap(<Title>X</Title>);
    expect(container.firstChild?.nodeName).toBe('H1');
  });

  it('renders correct heading element per level', () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const { container } = wrap(<Title level={level}>X</Title>);
      expect(container.firstChild?.nodeName).toBe(`H${level}`);
    }
  });
});
