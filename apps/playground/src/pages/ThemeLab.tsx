import { Container, Stack, Group, Title, Text, Paper } from '@soribashi/core';
import { Button } from '../components/Button/Button.tsx';

const INTENTS = ['primary', 'neutral', 'danger', 'success', 'warning', 'info'] as const;
const VARIANTS = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export function ThemeLab() {
  return (
    <Container size="xl" px="lg">
      <Stack gap="xl">
        <Title level={1}>Soribashi Theme Lab</Title>

        <Paper p="lg" withBorder shadow="sm">
          <Stack gap="md">
            <Title level={2}>Intent × Variant Matrix</Title>
            <Text color="muted">
              Every Button below is the same component. Color decisions live in the theme's
              intentResolver. Adding a new intent or variant happens in exactly one place.
            </Text>

            <Stack gap="md">
              {INTENTS.map((intent) => (
                <Group key={intent} gap="sm" align="center">
                  <div style={{ width: '6rem', textTransform: 'capitalize' }}>{intent}</div>
                  {VARIANTS.map((variant) => (
                    <Button key={variant} intent={intent} variant={variant}>
                      {variant}
                    </Button>
                  ))}
                </Group>
              ))}
            </Stack>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder shadow="sm">
          <Stack gap="md">
            <Title level={2}>Sizes</Title>
            <Group>
              {SIZES.map((size) => (
                <Button key={size} size={size}>
                  Size {size}
                </Button>
              ))}
            </Group>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder shadow="sm">
          <Stack gap="md">
            <Title level={2}>States</Title>
            <Group>
              <Button>Default</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button fullWidth>Full Width</Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
