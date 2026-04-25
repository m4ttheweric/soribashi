import {
  Container,
  Stack,
  Group,
  Grid,
  SimpleGrid,
  Center,
  Box,
  Paper,
  Text,
  Title,
  Space,
} from '@soribashi/core';

export function BlocksDemo() {
  return (
    <Container size="xl" px="lg">
      <Stack gap="xl">
        <Title level={1}>Layout Blocks</Title>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Stack</Title>
            <Stack gap="sm">
              {['One', 'Two', 'Three'].map((s) => (
                <Box key={s} bg="surface.raised" p="md" bdrs="md">
                  {s}
                </Box>
              ))}
            </Stack>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Group</Title>
            <Group gap="sm">
              {['One', 'Two', 'Three'].map((s) => (
                <Box key={s} bg="surface.raised" p="md" bdrs="md">
                  {s}
                </Box>
              ))}
            </Group>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Grid</Title>
            <Grid columns={12} gap="md">
              <Grid.Col span={4}>
                <Box bg="surface.raised" p="md" bdrs="md">
                  span 4
                </Box>
              </Grid.Col>
              <Grid.Col span={4}>
                <Box bg="surface.raised" p="md" bdrs="md">
                  span 4
                </Box>
              </Grid.Col>
              <Grid.Col span={4}>
                <Box bg="surface.raised" p="md" bdrs="md">
                  span 4
                </Box>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box bg="surface.raised" p="md" bdrs="md">
                  span 6
                </Box>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box bg="surface.raised" p="md" bdrs="md">
                  span 6
                </Box>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>SimpleGrid</Title>
            <SimpleGrid cols={3} spacing="md">
              {['A', 'B', 'C', 'D', 'E', 'F'].map((s) => (
                <Box key={s} bg="surface.raised" p="md" bdrs="md">
                  {s}
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Typography</Title>
            <Title level={1}>Title 1</Title>
            <Title level={2}>Title 2</Title>
            <Title level={3}>Title 3</Title>
            <Text size="lg">Body large</Text>
            <Text>Body default</Text>
            <Text color="muted">Muted text</Text>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Title level={3}>Center</Title>
            <Center>
              <Box bg="surface.raised" p="lg" bdrs="md">
                Centered
              </Box>
            </Center>
          </Stack>
        </Paper>
      </Stack>

      <Space h="2xl" />
    </Container>
  );
}
