import {
  AspectRatio,
  Box,
  Center,
  Container,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@soribashi/ui';

const GROUP_ITEMS = ['One', 'Two', 'Three', 'Four'];
const GRID_ITEMS = ['Alpha', 'Beta', 'Gamma'];

/**
 * Exercises all ten layout recipes at once: Container wraps a Stack of
 * sections, each section demonstrating one or more recipes purely through
 * props. No section reaches for a hand-rolled flex/grid div or a new CSS
 * file; every layout decision here goes through a recipe or a universal
 * style prop, same as a real consumer would compose them.
 */
export function LayoutPage() {
  return (
    <Container size="lg">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1}>Layout</Title>
          <Text dimmed>
            All ten layout recipes, composed together. Every section below is styled only through
            recipe props and universal style props.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={2}>Group</Title>
          <Text dimmed>A row of Papers that wraps once it runs out of horizontal space.</Text>
          <Group gap="md">
            {GROUP_ITEMS.map((label) => (
              <Paper key={label} withBorder p="md">
                <Text>{label}</Text>
              </Paper>
            ))}
          </Group>
        </Stack>

        <Stack gap="sm">
          <Title order={2}>Grid</Title>
          <Text dimmed>
            Papers arranged in a three-column grid, each holding a Title and a Text.
          </Text>
          <Grid cols={3} spacing="md">
            {GRID_ITEMS.map((label) => (
              <Paper key={label} withBorder p="md">
                <Title order={4}>{label}</Title>
                <Text dimmed>Grid cell content for {label}.</Text>
              </Paper>
            ))}
          </Grid>
        </Stack>

        <Stack gap="sm">
          <Title order={2}>AspectRatio</Title>
          <Text dimmed>A fixed 16:9 box holding a placeholder.</Text>
          <Box maw="20rem">
            <AspectRatio ratio={16 / 9}>
              <Box bg="surface.raised" w="100%" h="100%" />
            </AspectRatio>
          </Box>
        </Stack>

        <Stack gap="sm">
          <Title order={2}>Center</Title>
          <Text dimmed>Content centered on both axes within a fixed-height Paper.</Text>
          <Paper withBorder>
            <Center h="6rem">
              <Text>Centered content</Text>
            </Center>
          </Paper>
        </Stack>

        <Stack gap="sm">
          <Title order={2}>Box (style props)</Title>
          <Text dimmed>
            A responsive padding prop (compact below the md breakpoint, roomy at md and up) and a
            visibility prop (hidden while the dark theme is active) resolved through the universal
            style-prop path every recipe shares.
          </Text>
          <Box bg="surface.raised" p={{ base: 'sm', md: 'xl' }} darkHidden>
            <Text>Only visible in the light theme; toggle dark mode to hide this box.</Text>
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}
