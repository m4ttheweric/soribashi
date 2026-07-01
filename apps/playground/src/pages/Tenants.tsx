import { Container, Group, Paper, Stack, Text, Title } from '@soribashi/core';
import { Button } from '../components/Button/Button.tsx';

/**
 * Demonstrates per-tenant scoped codegen. Each tenant theme was emitted under
 * its own class selector (`.tenant-acme`, `.tenant-contoso`) so the same
 * components render with that tenant's brand tokens just by wrapping in the
 * matching div. No provider swap, no remount.
 */

const tenants = [
  {
    id: 'default',
    label: 'Default (root scope)',
    className: '',
    description: 'Tokens emitted at :root — the playground default.',
  },
  {
    id: 'acme',
    label: 'Acme — orange brand, softer corners',
    className: 'tenant-acme',
    description: 'Tokens emitted under .tenant-acme. Same Button, different brand.',
  },
  {
    id: 'contoso',
    label: 'Contoso — violet brand, sharper corners',
    className: 'tenant-contoso',
    description: 'Tokens emitted under .tenant-contoso.',
  },
] as const;

export function Tenants() {
  return (
    <Container size="xl">
      <Stack>
        <Stack gap="xs">
          <Title order={2}>Per-tenant scope codegen</Title>
          <Text c="muted">
            One Button component, three CSS variable scopes. Each scope is the output of{' '}
            <code>createTheme(&#123; scope: '.tenant-…' &#125;)</code> + <code>emitCss</code>,
            written by <code>scripts/codegen-tenants.ts</code>.
          </Text>
        </Stack>

        {tenants.map((tenant) => (
          <Paper key={tenant.id} p="lg" radius="md">
            <Stack gap="md">
              <Stack gap="xs">
                <Title order={4}>{tenant.label}</Title>
                <Text size="sm" c="muted">
                  {tenant.description}
                </Text>
              </Stack>

              <div className={tenant.className}>
                <Group>
                  <Button intent="primary" variant="filled">
                    Filled
                  </Button>
                  <Button intent="primary" variant="outline">
                    Outline
                  </Button>
                  <Button intent="primary" variant="subtle">
                    Subtle
                  </Button>
                  <Button intent="primary" variant="ghost">
                    Ghost
                  </Button>
                  <Button intent="primary" variant="link">
                    Link
                  </Button>
                </Group>
              </div>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
