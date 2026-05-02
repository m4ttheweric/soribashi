import type { Meta, StoryObj } from '@storybook/react';

import { Col } from '../Layout/Col';
import { Row } from '../Layout/Row';
import { MenuDivider } from '../Menu/MenuDivider';
import { MenuHeader } from '../Menu/MenuHeader';
import { MenuItem } from '../Menu/MenuItem';
import { Text } from '../Typography/Text';
import { ButtonDropdown } from './ButtonDropdown';

const meta = {
  title: 'Core Radix/Buttons/ButtonDropdown',
  component: ButtonDropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  children: 'Button',
  dropdownContent: <MenuItem>Item</MenuItem>,
};

export const Basic: Story = {
  args: defaultArgs,
  render: () => (
    <ButtonDropdown
      variant="primary"
      dropdownContent={
        <div className="p-1">
          <MenuItem onClick={() => alert('Edit')}>Edit</MenuItem>
          <MenuItem onClick={() => alert('Duplicate')}>Duplicate</MenuItem>
          <MenuItem variant="danger" onClick={() => alert('Delete')}>
            Delete
          </MenuItem>
        </div>
      }
    >
      Actions
    </ButtonDropdown>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ButtonDropdown
  variant="primary"
  dropdownContent={
    <div className="p-1">
      <MenuItem onClick={() => alert('Edit')}>Edit</MenuItem>
      <MenuItem onClick={() => alert('Duplicate')}>Duplicate</MenuItem>
      <MenuItem variant="danger" onClick={() => alert('Delete')}>Delete</MenuItem>
    </div>
  }
>
  Actions
</ButtonDropdown>`,
      },
    },
  },
};

export const WithDividers: Story = {
  args: defaultArgs,
  render: () => (
    <ButtonDropdown
      variant="outline"
      dropdownContent={
        <div className="p-1">
          <MenuItem>New File</MenuItem>
          <MenuItem>Open</MenuItem>
          <MenuDivider />
          <MenuItem>Save</MenuItem>
          <MenuItem>Save As</MenuItem>
          <MenuDivider />
          <MenuItem variant="danger">Delete</MenuItem>
        </div>
      }
    >
      More Options
    </ButtonDropdown>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ButtonDropdown
  variant="outline"
  dropdownContent={
    <div className="p-1">
      <MenuItem>New File</MenuItem>
      <MenuItem>Open</MenuItem>
      <MenuDivider />
      <MenuItem>Save</MenuItem>
      <MenuItem>Save As</MenuItem>
      <MenuDivider />
      <MenuItem variant="danger">Delete</MenuItem>
    </div>
  }
>
  More Options
</ButtonDropdown>`,
      },
    },
  },
};

export const WithHeader: Story = {
  args: defaultArgs,
  render: () => (
    <ButtonDropdown
      dropdownContainerClassName="w-56"
      dropdownContent={
        <div className="p-1">
          <MenuHeader>
            <Text variant="label">John Doe</Text>
            <Text variant="small" className="text-neutral-500">
              john@example.com
            </Text>
          </MenuHeader>
          <MenuItem>Profile</MenuItem>
          <MenuItem>Settings</MenuItem>
          <MenuDivider />
          <MenuItem variant="danger">Sign out</MenuItem>
        </div>
      }
    >
      User Menu
    </ButtonDropdown>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ButtonDropdown
  dropdownContainerClassName="w-56"
  dropdownContent={
    <div className="p-1">
      <MenuHeader>
        <Text variant="label">John Doe</Text>
        <Text variant="small" className="text-neutral-500">john@example.com</Text>
      </MenuHeader>
      <MenuItem>Profile</MenuItem>
      <MenuItem>Settings</MenuItem>
      <MenuDivider />
      <MenuItem variant="danger">Sign out</MenuItem>
    </div>
  }
>
  User Menu
</ButtonDropdown>`,
      },
    },
  },
};

export const RightAligned: Story = {
  args: defaultArgs,
  render: () => (
    <ButtonDropdown
      variant="ghost"
      dropdownAlign="right"
      dropdownContent={
        <div className="p-1">
          <MenuItem>Share</MenuItem>
          <MenuItem>Export</MenuItem>
          <MenuItem>Print</MenuItem>
        </div>
      }
    >
      Menu
    </ButtonDropdown>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ButtonDropdown
  variant="ghost"
  dropdownAlign="right"
  dropdownContent={
    <div className="p-1">
      <MenuItem>Share</MenuItem>
      <MenuItem>Export</MenuItem>
      <MenuItem>Print</MenuItem>
    </div>
  }
>
  Menu
</ButtonDropdown>`,
      },
    },
  },
};

export const Interactive: Story = {
  args: defaultArgs,
  render: function InteractiveStory() {
    const [lastAction, setLastAction] = window.React.useState<string>('None');

    return (
      <Col spacing={4} align="center">
        <Text variant="small">Last action: {lastAction}</Text>
        <ButtonDropdown
          variant="primary"
          dropdownContent={
            <div className="p-1">
              <MenuItem onClick={() => setLastAction('Edit clicked')}>
                Edit
              </MenuItem>
              <MenuItem onClick={() => setLastAction('View clicked')}>
                View
              </MenuItem>
              <MenuItem onClick={() => setLastAction('Share clicked')}>
                Share
              </MenuItem>
              <MenuDivider />
              <MenuItem
                variant="danger"
                onClick={() => setLastAction('Delete clicked')}
              >
                Delete
              </MenuItem>
            </div>
          }
        >
          Actions
        </ButtonDropdown>
      </Col>
    );
  },
  parameters: {
    docs: {
      source: {
        code: `const [lastAction, setLastAction] = useState<string>('None');

<Col spacing={4} align="center">
  <Text variant="small">Last action: {lastAction}</Text>
  <ButtonDropdown
    variant="primary"
    dropdownContent={
      <div className="p-1">
        <MenuItem onClick={() => setLastAction('Edit clicked')}>Edit</MenuItem>
        <MenuItem onClick={() => setLastAction('View clicked')}>View</MenuItem>
      </div>
    }
  >
    Actions
  </ButtonDropdown>
</Col>`,
      },
    },
  },
};

export const DifferentButtonVariants: Story = {
  args: defaultArgs,
  render: () => (
    <Row spacing={4} className="flex-wrap">
      <ButtonDropdown
        variant="primary"
        dropdownContent={
          <div className="p-1">
            <MenuItem>Option 1</MenuItem>
            <MenuItem>Option 2</MenuItem>
          </div>
        }
      >
        Primary
      </ButtonDropdown>
      <ButtonDropdown
        variant="secondary"
        dropdownContent={
          <div className="p-1">
            <MenuItem>Option 1</MenuItem>
            <MenuItem>Option 2</MenuItem>
          </div>
        }
      >
        Secondary
      </ButtonDropdown>
      <ButtonDropdown
        variant="outline"
        dropdownContent={
          <div className="p-1">
            <MenuItem>Option 1</MenuItem>
            <MenuItem>Option 2</MenuItem>
          </div>
        }
      >
        Outline
      </ButtonDropdown>
    </Row>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Row spacing={4}>
  <ButtonDropdown
    variant="primary"
    dropdownContent={
      <div className="p-1">
        <MenuItem>Option 1</MenuItem>
        <MenuItem>Option 2</MenuItem>
      </div>
    }
  >
    Primary
  </ButtonDropdown>
  <ButtonDropdown
    variant="secondary"
    dropdownContent={
      <div className="p-1">
        <MenuItem>Option 1</MenuItem>
        <MenuItem>Option 2</MenuItem>
      </div>
    }
  >
    Secondary
  </ButtonDropdown>
</Row>`,
      },
    },
  },
};
