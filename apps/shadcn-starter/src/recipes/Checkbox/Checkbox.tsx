import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { defineComponent } from '../../builders.ts';

// Checkbox wraps @radix-ui/react-checkbox: a single defineComponent with two
// selectors (root, indicator). No vocabulary axes, no variants.

const selectors = ['root', 'indicator'] as const;

const classes = {
  root: [
    'peer size-4 shrink-0 rounded-[4px] border border-(--border-input) shadow-xs outline-none transition-shadow',
    'focus-visible:border-(--border-focus) focus-visible:ring-[3px] focus-visible:ring-(--border-focus)/50',
    'aria-invalid:border-(--color-danger-500) aria-invalid:ring-(--color-danger-500)/20 dark:aria-invalid:ring-(--color-danger-500)/40',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[state=checked]:bg-(--color-primary-500) data-[state=checked]:text-(--color-primary-foreground)',
    'data-[state=checked]:border-transparent',
  ].join(' '),
  indicator: 'grid place-content-center text-current transition-none',
};

interface CheckboxOwnProps {
  id?: string;
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
}

export const Checkbox = defineComponent<CheckboxOwnProps>({
  name: 'Checkbox',
  selectors,
  classes,
  render: ({ props, getStyles, ref }: any) => {
    const {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      required,
      name,
      value,
      className,
      style,
      classNames,
      styles,
      unstyled,
      attributes,
      vars,
      ...rest
    } = props;
    return (
      <RadixCheckbox.Root
        ref={ref}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        {...rest}
        {...getStyles('root')}
      >
        <RadixCheckbox.Indicator {...getStyles('indicator')}>
          <Check className="h-3.5 w-3.5" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
    );
  },
});

export const checkboxTheme = Checkbox.extend({});
