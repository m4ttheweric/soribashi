import { SoribashiProvider } from '@soribashi/factory';
import { createTheme } from '@soribashi/theme';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  AspectRatio,
  Box,
  Center,
  Container,
  Flex,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Space,
  Stack,
  Text,
  Title,
} from '../src/index.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

function expectRefAttached(ui: (ref: React.Ref<HTMLElement>) => React.ReactNode) {
  const ref = createRef<HTMLElement>();
  wrap(ui(ref));
  expect(ref.current).toBeInstanceOf(HTMLElement);
}

describe('ref forwarding', () => {
  it('Box attaches ref to the rendered element', () => {
    const ref = createRef<HTMLDivElement>();
    wrap(<Box ref={ref}>X</Box>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('Box attaches ref with as prop', () => {
    const ref = createRef<HTMLElement>();
    wrap(
      <Box as="section" ref={ref}>
        X
      </Box>,
    );
    expect(ref.current?.tagName).toBe('SECTION');
  });

  it('Stack forwards ref', () => {
    expectRefAttached((ref) => <Stack ref={ref}>X</Stack>);
  });

  it('Group forwards ref', () => {
    expectRefAttached((ref) => <Group ref={ref}>X</Group>);
  });

  it('Flex forwards ref', () => {
    expectRefAttached((ref) => <Flex ref={ref}>X</Flex>);
  });

  it('Grid forwards ref', () => {
    expectRefAttached((ref) => <Grid ref={ref}>X</Grid>);
  });

  it('Grid.Col forwards ref', () => {
    const ref = createRef<HTMLElement>();
    wrap(
      <Grid>
        <Grid.Col span={6} ref={ref}>
          X
        </Grid.Col>
      </Grid>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('SimpleGrid forwards ref', () => {
    expectRefAttached((ref) => <SimpleGrid ref={ref}>X</SimpleGrid>);
  });

  it('Container forwards ref', () => {
    expectRefAttached((ref) => <Container ref={ref}>X</Container>);
  });

  it('Center forwards ref', () => {
    expectRefAttached((ref) => <Center ref={ref}>X</Center>);
  });

  it('AspectRatio forwards ref', () => {
    expectRefAttached((ref) => (
      <AspectRatio ratio={16 / 9} ref={ref}>
        X
      </AspectRatio>
    ));
  });

  it('Space forwards ref', () => {
    expectRefAttached((ref) => <Space h="md" ref={ref} />);
  });

  it('Paper forwards ref', () => {
    expectRefAttached((ref) => <Paper ref={ref}>X</Paper>);
  });

  it('Text forwards ref', () => {
    const ref = createRef<HTMLElement>();
    wrap(<Text ref={ref}>X</Text>);
    expect(ref.current?.tagName).toBe('P');
  });

  it('Title forwards ref', () => {
    const ref = createRef<HTMLElement>();
    wrap(
      <Title order={2} ref={ref}>
        X
      </Title>,
    );
    expect(ref.current?.tagName).toBe('H2');
  });
});
