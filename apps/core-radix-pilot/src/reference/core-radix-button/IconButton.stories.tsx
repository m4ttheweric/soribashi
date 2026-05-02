import type { Meta, StoryObj } from '@storybook/react';
import { Dot } from '../Dot/Dot';
import { islandsIconKeys } from '../Icons/iconKeys';
import { IconButton } from './IconButton';

const meta = {
  title: 'Core Radix/Buttons/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  icon: islandsIconKeys.gear,
  'aria-label': 'Settings',
};

export const Default: Story = {
  args: defaultArgs,
  render: () => <IconButton aria-label="Search" icon={islandsIconKeys.gear} />,
  parameters: {
    docs: {
      source: {
        code: `<IconButton aria-label="Search" icon={islandsIconKeys.gear} />`,
      },
    },
  },
};

export const AllVariants: Story = {
  args: defaultArgs,
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <IconButton
        variant="primary"
        icon={islandsIconKeys.threeDotsHorizontal}
        aria-label="More options"
      />
      <IconButton
        variant="secondary"
        icon={islandsIconKeys.threeDotsHorizontal}
        aria-label="More options"
      />
      <IconButton
        variant="outline"
        icon={islandsIconKeys.threeDotsHorizontal}
        aria-label="More options"
      />
      <IconButton
        variant="ghost"
        icon={islandsIconKeys.threeDotsHorizontal}
        aria-label="More options"
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<div className="flex gap-4">
  <IconButton variant="primary" icon={islandsIconKeys.threeDotsHorizontal} aria-label="More" />
  <IconButton variant="secondary" icon={islandsIconKeys.threeDotsHorizontal} aria-label="More" />
  <IconButton variant="outline" icon={islandsIconKeys.threeDotsHorizontal} aria-label="More" />
  <IconButton variant="ghost" icon={islandsIconKeys.threeDotsHorizontal} aria-label="More" />
</div>`,
      },
    },
  },
};

export const AllSizes: Story = {
  args: defaultArgs,
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <IconButton
        variant="primary"
        icon={islandsIconKeys.coffin}
        aria-label="Close"
        size="sm"
      />
      <IconButton
        variant="primary"
        icon={islandsIconKeys.gravestone}
        aria-label="Close"
        size="md"
      />
      <IconButton
        variant="primary"
        icon={islandsIconKeys.bandaid}
        aria-label="Close"
        size="lg"
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<div className="flex gap-4 items-center">
  <IconButton variant="primary" icon={islandsIconKeys.coffin} aria-label="Close" size="sm" />
  <IconButton variant="primary" icon={islandsIconKeys.gravestone} aria-label="Close" size="md" />
  <IconButton variant="primary" icon={islandsIconKeys.bandaid} aria-label="Close" size="lg" />
</div>`,
      },
    },
  },
};

export const WithDotIndicators: Story = {
  args: defaultArgs,
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <IconButton
        icon={islandsIconKeys.addressBook2}
        aria-label="Notifications"
        variant="primary"
        size="sm"
        dot={<Dot color="red" size="sm" />}
      />
      <IconButton
        icon={islandsIconKeys.addressBook2}
        aria-label="Messages"
        variant="secondary"
        size="md"
        dot={<Dot color="blue" size="sm" />}
      />
      <IconButton
        icon={islandsIconKeys.addressBook2}
        aria-label="Profile"
        variant="outline"
        size="lg"
        dot={<Dot color="green" size="md" glowing />}
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<IconButton
  icon={islandsIconKeys.addressBook2}
  aria-label="Notifications"
  variant="primary"
  dot={<Dot color="red" size="sm" />}
/>`,
      },
    },
  },
};

export const Disabled: Story = {
  args: defaultArgs,
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <IconButton
        variant="primary"
        icon={islandsIconKeys.gear}
        aria-label="Settings"
        disabled
      />
      <IconButton
        variant="secondary"
        icon={islandsIconKeys.gear}
        aria-label="Settings"
        disabled
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<IconButton
  variant="primary"
  icon={islandsIconKeys.gear}
  aria-label="Settings"
  disabled
/>`,
      },
    },
  },
};

export const DifferentIcons: Story = {
  args: defaultArgs,
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <IconButton
        variant="primary"
        icon={islandsIconKeys.users}
        aria-label="Users"
      />
      <IconButton
        variant="primary"
        icon={islandsIconKeys.gear}
        aria-label="Settings"
      />
      <IconButton
        variant="primary"
        icon={islandsIconKeys.threeDotsHorizontal}
        aria-label="More options"
      />
      <IconButton
        variant="primary"
        icon={islandsIconKeys.bell2}
        aria-label="Notifications"
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<div className="flex gap-4">
  <IconButton variant="primary" icon={islandsIconKeys.users} aria-label="Users" />
  <IconButton variant="primary" icon={islandsIconKeys.gear} aria-label="Settings" />
  <IconButton variant="primary" icon={islandsIconKeys.threeDotsHorizontal} aria-label="More" />
  <IconButton variant="primary" icon={islandsIconKeys.bell2} aria-label="Notifications" />
</div>`,
      },
    },
  },
};
