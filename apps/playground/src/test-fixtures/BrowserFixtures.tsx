/**
 * BrowserFixtures — a standalone page that renders each of the 14 soribashi
 * blocks in 3 prop configurations for Playwright computed-style assertions.
 *
 * Mounted at /browser-fixtures via a separate entry point so it never
 * interferes with App.tsx or the existing playground routing.
 *
 * data-testid convention:  {block}-{config}
 *   config 0 = default  |  config 1 = common  |  config 2 = stress
 */
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
  SoribashiProvider,
  createTheme,
  defaultTokens,
  defaultDarkTokens,
  defineVocabulary,
} from '@soribashi/core';

const theme = createTheme({
  name: 'browser-fixtures',
  tokens: defaultTokens,
  dark: defaultDarkTokens,
  vocabulary: {
    intent: defineVocabulary(['primary', 'neutral', 'danger', 'success', 'warning', 'info']),
    variant: defineVocabulary(['filled', 'outline', 'subtle', 'ghost', 'link']),
  },
  semanticTokens: {
    text: {
      default: 'colors.neutral.900',
      muted: 'colors.neutral.500',
      disabled: 'colors.neutral.400',
    },
    surface: {
      canvas: 'colors.neutral.50',
      default: 'colors.neutral.0',
      raised: 'colors.neutral.100',
      sunken: 'colors.neutral.50',
      overlay: 'colors.neutral.900',
    },
    border: {
      default: 'colors.neutral.200',
      strong: 'colors.neutral.400',
      muted: 'colors.neutral.100',
    },
  },
});

export function BrowserFixtures() {
  return (
    <SoribashiProvider theme={theme}>
      <div style={{ padding: '1rem' }}>

        {/* ===== Box ===== */}
        {/* config 0: default — just the root class, display:block from UA */}
        <Box data-testid="box-0">Box default</Box>

        {/* config 1: padding style prop */}
        <Box data-testid="box-1" p="md">Box p=md</Box>

        {/* config 2: hiddenFrom="md" — rendered but hidden at ≥ 768px */}
        <Box data-testid="box-2" hiddenFrom="md">Box hiddenFrom=md</Box>

        {/* ===== Stack ===== */}
        {/* config 0: default gap (--spacing-md) */}
        <Stack data-testid="stack-0">
          <span>A</span><span>B</span>
        </Stack>

        {/* config 1: explicit gap="lg" */}
        <Stack data-testid="stack-1" gap="lg">
          <span>A</span><span>B</span>
        </Stack>

        {/* config 2: align="center" */}
        <Stack data-testid="stack-2" align="center">
          <span>A</span>
        </Stack>

        {/* ===== Group ===== */}
        {/* config 0: default */}
        <Group data-testid="group-0">
          <span>A</span><span>B</span>
        </Group>

        {/* config 1: justify="center" */}
        <Group data-testid="group-1" justify="center">
          <span>A</span><span>B</span>
        </Group>

        {/* config 2: wrap="nowrap" gap="xs" */}
        <Group data-testid="group-2" wrap="nowrap" gap="xs">
          <span>A</span><span>B</span>
        </Group>

        {/* ===== Flex ===== */}
        {/* config 0: default */}
        <Flex data-testid="flex-0">
          <span>A</span>
        </Flex>

        {/* config 1: direction="column-reverse" */}
        <Flex data-testid="flex-1" direction="column-reverse">
          <span>A</span><span>B</span>
        </Flex>

        {/* config 2: justify="space-between" align="flex-end" */}
        <Flex data-testid="flex-2" justify="space-between" align="flex-end">
          <span>A</span><span>B</span>
        </Flex>

        {/* ===== Grid ===== */}
        {/* config 0: default 12-column grid */}
        <Grid data-testid="grid-0">
          <Grid.Col span={6} data-testid="grid-col-0">Half</Grid.Col>
          <Grid.Col span={6}>Half</Grid.Col>
        </Grid>

        {/* config 1: 6-column grid, col span=3 → 50% */}
        <Grid data-testid="grid-1" columns={6}>
          <Grid.Col span={3} data-testid="grid-col-1">3/6</Grid.Col>
          <Grid.Col span={3}>3/6</Grid.Col>
        </Grid>

        {/* config 2: gap="xl" */}
        <Grid data-testid="grid-2" gap="xl">
          <Grid.Col span={12} data-testid="grid-inner-2">Full</Grid.Col>
        </Grid>

        {/* ===== SimpleGrid ===== */}
        {/* config 0: default cols=1 */}
        <SimpleGrid data-testid="sg-0">
          <span>A</span><span>B</span>
        </SimpleGrid>

        {/* config 1: cols=3 */}
        <SimpleGrid data-testid="sg-1" cols={3}>
          <span>A</span><span>B</span><span>C</span>
        </SimpleGrid>

        {/* config 2: minColWidth="200px" → auto-fill */}
        <SimpleGrid data-testid="sg-2" minColWidth="200px">
          <span>A</span><span>B</span>
        </SimpleGrid>

        {/* ===== Container ===== */}
        {/* config 0: default size=md */}
        <Container data-testid="container-0">
          Default container
        </Container>

        {/* config 1: size="xl" */}
        <Container data-testid="container-1" size="xl">
          XL container
        </Container>

        {/* config 2: fluid */}
        <Container data-testid="container-2" fluid>
          Fluid container
        </Container>

        {/* ===== Center ===== */}
        {/* config 0: default block */}
        <Center data-testid="center-0" style={{ height: '80px' }}>
          Centered
        </Center>

        {/* config 1: inline */}
        <Center data-testid="center-1" inline>
          Inline centered
        </Center>

        {/* config 2: nested child */}
        <Center data-testid="center-2" style={{ width: '200px', height: '80px' }}>
          <span>Child</span>
        </Center>

        {/* ===== AspectRatio ===== */}
        {/* config 0: default ratio 1 — use Box prop `w` to avoid style-merge conflict */}
        <AspectRatio data-testid="ar-0" w="200px">
          <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="" />
        </AspectRatio>

        {/* config 1: ratio 16/9 */}
        <AspectRatio data-testid="ar-1" ratio={16 / 9} w="200px">
          <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="" data-testid="ar-1-child" />
        </AspectRatio>

        {/* config 2: ratio 4/3, with a div child */}
        <AspectRatio data-testid="ar-2" ratio={4 / 3} w="200px">
          <div data-testid="ar-2-child" style={{ background: 'red' }} />
        </AspectRatio>

        {/* ===== Space ===== */}
        {/* config 0: h="md" — height should resolve --spacing-md */}
        <Space data-testid="space-0" h="md" />

        {/* config 1: h="xl" */}
        <Space data-testid="space-1" h="xl" />

        {/* config 2: w="lg" (horizontal spacer) */}
        <div style={{ display: 'flex' }}>
          <Space data-testid="space-2" w="lg" />
        </div>

        {/* ===== Paper ===== */}
        {/* config 0: default (no border, no shadow) */}
        <Paper data-testid="paper-0" p="md">
          Default paper
        </Paper>

        {/* config 1: withBorder */}
        <Paper data-testid="paper-1" withBorder p="md">
          Paper with border
        </Paper>

        {/* config 2: shadow="md" radius="lg" */}
        <Paper data-testid="paper-2" shadow="md" radius="lg" p="md">
          Shadow paper
        </Paper>

        {/* ===== Text ===== */}
        {/* config 0: default */}
        <Text data-testid="text-0">Default text</Text>

        {/* config 1: size="sm" */}
        <Text data-testid="text-1" size="sm">Small text</Text>

        {/* config 2: lineClamp=3 */}
        <Text data-testid="text-2" lineClamp={3}>
          Line clamp text line 1. Line 2. Line 3. Line 4 gets clamped.
          More text here that should be hidden beyond the 3-line limit.
        </Text>

        {/* ===== Title ===== */}
        {/* config 0: order=1 (default) */}
        <Title data-testid="title-0" order={1}>H1 Title</Title>

        {/* config 1: order=3 */}
        <Title data-testid="title-1" order={3}>H3 Title</Title>

        {/* config 2: order=1 lineClamp=2 */}
        <Title data-testid="title-2" order={1} lineClamp={2}>
          Title with line clamp — this is a very long title that will be clamped at two lines
          when rendered in the browser
        </Title>
      </div>
    </SoribashiProvider>
  );
}
