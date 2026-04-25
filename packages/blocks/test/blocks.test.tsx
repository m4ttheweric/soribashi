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

describe('Box', () => {
  it('renders div by default', () => {
    const { container } = wrap(<Box>X</Box>);
    expect(container.firstChild?.nodeName).toBe('DIV');
    expect((container.firstChild as HTMLElement).className).toContain('sb-Box-root');
  });

  it('respects as prop', () => {
    const { container } = wrap(<Box as="section">X</Box>);
    expect(container.firstChild?.nodeName).toBe('SECTION');
  });

  it('forwards arbitrary HTML attributes', () => {
    const { container } = wrap(
      <Box id="test" data-foo="bar">
        X
      </Box>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.id).toBe('test');
    expect(el.getAttribute('data-foo')).toBe('bar');
  });

  it('applies p, radius, bg props', () => {
    const { container } = wrap(
      <Box p="md" radius="lg" bg="raised">
        X
      </Box>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.dataset.p).toBe('md');
    expect(el.dataset.radius).toBe('lg');
    expect(el.dataset.bg).toBe('raised');
  });
});

describe('Stack', () => {
  it('renders with default md gap', () => {
    const { container } = wrap(<Stack>X</Stack>);
    expect((container.firstChild as HTMLElement).dataset.gap).toBe('md');
  });

  it('applies gap, align, justify', () => {
    const { container } = wrap(
      <Stack gap="lg" align="center" justify="between">
        X
      </Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.dataset.gap).toBe('lg');
    expect(el.dataset.align).toBe('center');
    expect(el.dataset.justify).toBe('between');
  });
});

describe('Group', () => {
  it('renders with default md gap and wrap', () => {
    const { container } = wrap(<Group>X</Group>);
    const el = container.firstChild as HTMLElement;
    expect(el.dataset.gap).toBe('md');
    expect(el.dataset.wrap).toBe('wrap');
  });

  it('applies wrap=nowrap', () => {
    const { container } = wrap(<Group wrap="nowrap">X</Group>);
    expect((container.firstChild as HTMLElement).dataset.wrap).toBe('nowrap');
  });
});

describe('Flex', () => {
  it('renders with default direction=row', () => {
    const { container } = wrap(<Flex>X</Flex>);
    expect((container.firstChild as HTMLElement).dataset.direction).toBe('row');
  });

  it('respects direction=column', () => {
    const { container } = wrap(<Flex direction="column">X</Flex>);
    expect((container.firstChild as HTMLElement).dataset.direction).toBe('column');
  });
});

describe('Grid', () => {
  it('renders 12 columns by default', () => {
    const { container } = wrap(<Grid>X</Grid>);
    expect((container.firstChild as HTMLElement).dataset.columns).toBe('12');
  });

  it('Grid.Col is a compound component', () => {
    expect(Grid.Col).toBeDefined();
  });

  it('Grid.Col applies span', () => {
    const { container } = wrap(<Grid.Col span={6}>X</Grid.Col>);
    expect((container.firstChild as HTMLElement).dataset.span).toBe('6');
  });
});

describe('SimpleGrid', () => {
  it('renders 2 cols by default', () => {
    const { container } = wrap(<SimpleGrid>X</SimpleGrid>);
    expect((container.firstChild as HTMLElement).dataset.cols).toBe('2');
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
  it('renders with inline=false default', () => {
    const { container } = wrap(<Center>X</Center>);
    expect((container.firstChild as HTMLElement).dataset.inline).toBe('false');
  });

  it('respects inline prop', () => {
    const { container } = wrap(<Center inline>X</Center>);
    expect((container.firstChild as HTMLElement).dataset.inline).toBe('true');
  });
});

describe('AspectRatio', () => {
  it('renders with default 16/9 ratio', () => {
    const { container } = wrap(<AspectRatio>X</AspectRatio>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.aspectRatio).toBe(String(16 / 9));
  });

  it('respects custom ratio', () => {
    const { container } = wrap(<AspectRatio ratio={2}>X</AspectRatio>);
    expect((container.firstChild as HTMLElement).style.aspectRatio).toBe('2');
  });
});

describe('Space', () => {
  it('renders empty div with h prop', () => {
    const { container } = wrap(<Space h="md" />);
    const el = container.firstChild as HTMLElement;
    expect(el.nodeName).toBe('DIV');
    expect(el.dataset.h).toBe('md');
  });
});

describe('Paper', () => {
  it('renders with default shadow=sm radius=md p=md', () => {
    const { container } = wrap(<Paper>X</Paper>);
    const el = container.firstChild as HTMLElement;
    expect(el.dataset.shadow).toBe('sm');
    expect(el.dataset.radius).toBe('md');
    expect(el.dataset.p).toBe('md');
  });

  it('respects withBorder', () => {
    const { container } = wrap(<Paper withBorder>X</Paper>);
    expect((container.firstChild as HTMLElement).dataset.withBorder).toBe('true');
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
