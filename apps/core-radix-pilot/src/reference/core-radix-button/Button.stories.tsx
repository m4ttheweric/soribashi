import type { Meta, StoryObj } from '@storybook/react';

import { islandsIconKeys } from '../Icons/iconKeys';
import { Col } from '../Layout/Col';
import { Row } from '../Layout/Row';
import { Button } from './Button';

const meta = {
  title: 'Core Radix/Buttons/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'danger',
        'success',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <Row spacing={4} className="flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
    </Row>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Row spacing={4} className="flex-wrap">
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="danger">Danger</Button>
  <Button variant="success">Success</Button>
</Row>`,
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <Row spacing={4} align="center" className="flex-wrap">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Row>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Row spacing={4} align="center">
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
</Row>`,
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <Row spacing={4} className="flex-wrap">
      <Button variant="primary" disabled>
        Disabled Primary
      </Button>
      <Button variant="secondary" disabled>
        Disabled Secondary
      </Button>
      <Button variant="outline" disabled>
        Disabled Outline
      </Button>
    </Row>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Row spacing={4}>
  <Button variant="primary" disabled>Disabled Primary</Button>
  <Button variant="secondary" disabled>Disabled Secondary</Button>
  <Button variant="outline" disabled>Disabled Outline</Button>
</Row>`,
      },
    },
  },
};

export const FullWidth: Story = {
  render: () => (
    <Col spacing={4}>
      <div className="w-full">
        <Button variant="primary" fullWidth>
          Full Width Primary
        </Button>
      </div>
      <div className="w-[400px] space-y-2">
        <Button variant="secondary" fullWidth>
          Full Width (400px parent) Secondary
        </Button>
      </div>
    </Col>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Button variant="primary" fullWidth>
  Full Width Primary
</Button>`,
      },
    },
  },
};

export const AsLink: Story = {
  render: () => (
    <Button asChild>
      <a href="/">Link as Button</a>
    </Button>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Button asChild>
  <a href="/">Link as Button</a>
</Button>`,
      },
    },
  },
};

export const WithLeftAndRightIcons: Story = {
  render: () => (
    <Row spacing={4} className="flex-wrap">
      <Button variant="primary" leftIcon={islandsIconKeys.upload}>
        Add Item
      </Button>
      <Button variant="outline" rightIcon={islandsIconKeys.arrowRight}>
        Next
      </Button>
      <Button
        variant="secondary"
        leftIcon={islandsIconKeys.gear}
        rightIcon={islandsIconKeys.wrench}
      >
        Settings
      </Button>
    </Row>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Row spacing={4}>
  <Button variant="primary" leftIcon={islandsIconKeys.upload}>
    Add Item
  </Button>
  <Button variant="outline" rightIcon={islandsIconKeys.arrowRight}>
    Next
  </Button>
  <Button
    variant="secondary"
    leftIcon={islandsIconKeys.gear}
    rightIcon={islandsIconKeys.wrench}
  >
    Settings
  </Button>
</Row>`,
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <Row spacing={4} className="flex-wrap">
      <Button variant="primary" isLoading>
        Saving...
      </Button>
      <Button variant="secondary" isLoading>
        Processing...
      </Button>
      <Button variant="outline" isLoading>
        Loading...
      </Button>
    </Row>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Row spacing={4}>
  <Button variant="primary" isLoading>Saving...</Button>
  <Button variant="secondary" isLoading>Processing...</Button>
  <Button variant="outline" isLoading>Loading...</Button>
</Row>`,
      },
    },
  },
};

export const LoadingWithIconsLeftIconIsReplaced: Story = {
  render: () => (
    <Row spacing={4} className="flex-wrap">
      <Button variant="primary" isLoading leftIcon={islandsIconKeys.upload}>
        Save
      </Button>
      <Button
        variant="outline"
        isLoading
        rightIcon={islandsIconKeys.arrowRight}
      >
        Next
      </Button>
      <Button
        variant="secondary"
        isLoading
        leftIcon={islandsIconKeys.gear}
        rightIcon={islandsIconKeys.wrench}
      >
        Settings
      </Button>
    </Row>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Row spacing={4}>
  <Button variant="primary" isLoading leftIcon={islandsIconKeys.upload}>
    Save
  </Button>
  <Button variant="outline" isLoading rightIcon={islandsIconKeys.arrowRight}>
    Next
  </Button>
</Row>`,
      },
    },
  },
};
