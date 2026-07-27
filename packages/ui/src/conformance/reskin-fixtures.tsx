import type { ReactNode } from 'react';
import { Alert } from '../recipes/Alert/Alert.tsx';
import { AspectRatio } from '../recipes/AspectRatio/AspectRatio.tsx';
import { Badge } from '../recipes/Badge/Badge.tsx';
import { Box } from '../recipes/Box/Box.tsx';
import { Button } from '../recipes/Button/Button.tsx';
import { Center } from '../recipes/Center/Center.tsx';
import { Checkbox } from '../recipes/Checkbox/Checkbox.tsx';
import { Container } from '../recipes/Container/Container.tsx';
import { Dialog } from '../recipes/Dialog/Dialog.tsx';
import { Field } from '../recipes/Field/Field.tsx';
import { Grid } from '../recipes/Grid/Grid.tsx';
import { Group } from '../recipes/Group/Group.tsx';
import { Paper } from '../recipes/Paper/Paper.tsx';
import { Popover } from '../recipes/Popover/Popover.tsx';
import { RadioGroup } from '../recipes/RadioGroup/RadioGroup.tsx';
import { Select } from '../recipes/Select/Select.tsx';
import { Stack } from '../recipes/Stack/Stack.tsx';
import { Switch } from '../recipes/Switch/Switch.tsx';
import { Tabs } from '../recipes/Tabs/Tabs.tsx';
import { Text } from '../recipes/Text/Text.tsx';
import { Textarea } from '../recipes/Textarea/Textarea.tsx';
import { TextInput } from '../recipes/TextInput/TextInput.tsx';
import { Title } from '../recipes/Title/Title.tsx';
import { Tooltip } from '../recipes/Tooltip/Tooltip.tsx';

/**
 * One minimal, force-visible rendering per recipe, keyed by the recipe's
 * `recipeMeta.name` (see `getRecipeMeta` from `@soribashi/core`) rather than
 * the barrel's export name, since `reskin.test.tsx`'s guard test iterates
 * `recipeMeta.name`. `reskin.test.tsx` mounts every fixture directly into a
 * DOM node it controls (`scopeEl`), once under the default theme and once
 * inside a `.reskin-b`-scoped node under themeB, then diffs computed styles
 * on whichever element carries the `reskin-target` class.
 *
 * Convention every fixture below follows, and every future one must too:
 *   1. Mark the recipe's most visually representative slot with
 *      `classNames={{ <slot>: 'reskin-target' }}` (the Styles API every
 *      recipe already exposes), so the test can find it without any
 *      recipe-specific query logic.
 *   2. Forward `scopeEl` to any part that renders through a portal (e.g.
 *      Popover's `Content` -> `container`). A default portal escapes to
 *      `<body>`, outside the `.reskin-b` wrapper, which would leave the
 *      portalled content rendered against the BASE theme even during the
 *      "themeB" render, silently comparing base-theme against base-theme
 *      (a false failure, or worse, a false pass if the two renders happen to
 *      already differ for some unrelated reason).
 */
export const RESKIN_FIXTURES: Record<string, (scopeEl: HTMLElement) => ReactNode> = {
  Alert: () => (
    <Alert classNames={{ root: 'reskin-target' }} intent="info" variant="subtle">
      x
    </Alert>
  ),

  AspectRatio: () => (
    <AspectRatio className="reskin-target" p="md" ratio={16 / 9}>
      x
    </AspectRatio>
  ),

  Badge: () => (
    <Badge classNames={{ root: 'reskin-target' }} intent="primary" variant="filled">
      x
    </Badge>
  ),

  Box: () => (
    <Box className="reskin-target" bg="surface.raised" p="md">
      x
    </Box>
  ),

  Button: () => <Button classNames={{ root: 'reskin-target' }}>x</Button>,

  Center: () => (
    <Center className="reskin-target" p="md">
      x
    </Center>
  ),

  Checkbox: () => (
    <Checkbox classNames={{ control: 'reskin-target' }} intent="primary" defaultChecked label="x" />
  ),

  Container: () => <Container className="reskin-target">x</Container>,

  // `defaultOpen` force-opens without a click (Dialog's Root forwards it
  // straight to Base UI's DialogRoot, the same mount-time-open idiom
  // Tooltip's/Select's own fixtures use). `scopeEl` forwards to `container`
  // (Dialog.tsx's `ContentProps` -> the Portal): the same portal-escapes-scope
  // reason Popover's/Select's/Tooltip's fixtures give above -- without it
  // this guard would compare the base theme against itself.
  Dialog: (scopeEl) => (
    <Dialog.Root defaultOpen>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Content container={scopeEl} classNames={{ popup: 'reskin-target' }}>
        <Dialog.Title>Title</Dialog.Title>
      </Dialog.Content>
    </Dialog.Root>
  ),

  Field: () => (
    <Field.Root>
      <Field.Label classNames={{ label: 'reskin-target' }}>Label</Field.Label>
      <Field.Description>Description</Field.Description>
    </Field.Root>
  ),

  Grid: () => (
    <Grid className="reskin-target" spacing="md">
      <div>a</div>
      <div>b</div>
    </Grid>
  ),

  Group: () => (
    <Group className="reskin-target" gap="md">
      <div>a</div>
      <div>b</div>
    </Group>
  ),

  Paper: () => <Paper className="reskin-target">x</Paper>,

  Popover: (scopeEl) => (
    <Popover.Root open onOpenChange={() => {}}>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content container={scopeEl} classNames={{ popup: 'reskin-target' }}>
        <Popover.Title>Title</Popover.Title>
      </Popover.Content>
    </Popover.Root>
  ),

  RadioGroup: () => (
    <RadioGroup
      items={[
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
      ]}
      defaultValue="pro"
      classNames={{ control: 'reskin-target' }}
    />
  ),

  Select: (scopeEl) => (
    <Select
      items={[
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]}
      defaultOpen
      container={scopeEl}
      classNames={{ popup: 'reskin-target' }}
    />
  ),

  Stack: () => (
    <Stack className="reskin-target" gap="md">
      <div>a</div>
      <div>b</div>
    </Stack>
  ),

  Switch: () => <Switch label="x" defaultChecked classNames={{ control: 'reskin-target' }} />,

  Tabs: () => (
    <Tabs.Root defaultValue="a" classNames={{ tab: 'reskin-target' }}>
      <Tabs.List>
        <Tabs.Tab value="a">A</Tabs.Tab>
        <Tabs.Tab value="b">B</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">Panel A</Tabs.Panel>
      <Tabs.Panel value="b">Panel B</Tabs.Panel>
    </Tabs.Root>
  ),

  Text: () => <Text className="reskin-target">x</Text>,

  Textarea: () => <Textarea label="x" classNames={{ textarea: 'reskin-target' }} />,

  TextInput: () => <TextInput label="x" classNames={{ input: 'reskin-target' }} />,

  Title: () => <Title className="reskin-target">x</Title>,

  // `defaultOpen` force-opens without a hover/focus interaction (Tooltip's
  // Root forwards it straight to Base UI's TooltipRoot, same mount-time-open
  // idiom Select's `defaultOpen` fixture below uses). `scopeEl` forwards to
  // `container` (Tooltip.tsx's `ContentProps` -> the Portal): the same
  // portal-escapes-scope reason Popover's/Select's fixtures give above --
  // without it this guard would compare the base theme against itself.
  Tooltip: (scopeEl) => (
    <Tooltip.Root defaultOpen>
      <Tooltip.Trigger delay={0}>Hover me</Tooltip.Trigger>
      <Tooltip.Content container={scopeEl} classNames={{ popup: 'reskin-target' }}>
        x
      </Tooltip.Content>
    </Tooltip.Root>
  ),
};
