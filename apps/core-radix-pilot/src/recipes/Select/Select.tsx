/**
 * Select: data-driven, generically-typed form control authored with
 * defineGenericComponent. Mantine data model; react-select-grade inference
 * (Value narrows from data; `multiple` flips value/onChange). Engine: a minimal
 * useCombobox hook + @floating-ui/react positioning. Field wraps it.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useFloating, flip, shift, size, autoUpdate } from '@floating-ui/react';
import { defineGenericComponent } from '../../builders.ts';
import { Field } from '../Field/Field.tsx';
import { parseSelectData, flattenOptions, type ComboboxItem, type SelectData, type Primitive } from './parse-data.ts';
import { useCombobox } from './use-combobox.ts';
import classes from './Select.module.css';

export interface BaseSelectProps<V extends Primitive> {
  data: SelectData<V>;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  size?: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  id?: string;
}
export interface SingleProps<V extends Primitive> extends BaseSelectProps<V> {
  multiple?: false;
  value?: V | null;
  defaultValue?: V | null;
  onChange?: (value: V | null, option: ComboboxItem<V> | null) => void;
}
export interface MultiProps<V extends Primitive> extends BaseSelectProps<V> {
  multiple: true;
  value?: V[];
  defaultValue?: V[];
  onChange?: (value: V[], options: ComboboxItem<V>[]) => void;
}
export type SelectSignature = <const V extends Primitive = string>(
  props: SingleProps<V> | MultiProps<V>,
) => React.ReactElement | null;

let _id = 0;
function useAutoId(provided?: string): string {
  const ref = useRef<string | undefined>(provided);
  if (!ref.current) {
    _id += 1;
    ref.current = `select-${_id}`;
  }
  return provided ?? ref.current;
}

export const Select = defineGenericComponent<SelectSignature>({
  name: 'Select',
  selectors: ['trigger', 'dropdown', 'option', 'group', 'placeholder', 'pills', 'pill', 'clear'] as const,
  classes,
  render: ({ props }: any) => {
    const id = useAutoId(props.id);
    const parsed = useMemo(() => parseSelectData(props.data as SelectData<Primitive>), [props.data]);
    const options = useMemo(() => flattenOptions(parsed), [parsed]);

    const [opened, setOpened] = useState(false);
    const [uncontrolled, setUncontrolled] = useState<Primitive | null>(props.defaultValue ?? null);
    const isControlled = props.value !== undefined;
    const value: Primitive | null = isControlled ? (props.value ?? null) : uncontrolled;
    const selectedOption = options.find((o) => o.value === value) ?? null;

    const { activeIndex, setActiveIndex, onKeyDown } = useCombobox<Primitive>({ options, opened });

    const { refs, floatingStyles } = useFloating({
      open: opened,
      onOpenChange: setOpened,
      whileElementsMounted: autoUpdate,
      middleware: [flip(), shift({ padding: 8 }), size({
        apply({ rects, elements }) { elements.floating.style.width = `${rects.reference.width}px`; },
      })],
    });

    const close = () => { setOpened(false); setActiveIndex(-1); };

    const submit = (opt: ComboboxItem<Primitive>) => {
      if (opt.disabled) { return; }
      if (!isControlled) { setUncontrolled(opt.value); }
      props.onChange?.(opt.value, opt);
      close();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const r = onKeyDown(e);
      if (r.open) { setOpened(true); }
      if (r.close) { close(); }
      if (r.submit) { submit(r.submit); }
    };

    return (
      <Field id={id} label={props.label} description={props.description} error={props.error} required={props.required}>
        <button
          ref={refs.setReference}
          type="button"
          role="combobox"
          aria-expanded={opened}
          aria-controls={`${id}-listbox`}
          aria-describedby={[props.description ? `${id}-description` : '', props.error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
          aria-invalid={props.error ? true : undefined}
          disabled={props.disabled}
          data-disabled={props.disabled ? 'true' : undefined}
          className={classes.trigger}
          data-part="trigger"
          onClick={() => !props.disabled && setOpened((o) => !o)}
          onKeyDown={handleKeyDown}
        >
          <span className={selectedOption ? undefined : classes.placeholder} data-part="placeholder">
            {selectedOption ? selectedOption.label : props.placeholder}
          </span>
          <span aria-hidden>{opened ? '▲' : '▼'}</span>
        </button>
        {opened && (
          <ul
            ref={refs.setFloating}
            id={`${id}-listbox`}
            role="listbox"
            className={classes.dropdown}
            data-part="dropdown"
            style={floatingStyles}
          >
            {options.map((opt, i) => (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled || undefined}
                className={classes.option}
                data-part="option"
                data-active={i === activeIndex ? 'true' : undefined}
                data-selected={opt.value === value ? 'true' : undefined}
                data-disabled={opt.disabled ? 'true' : undefined}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => submit(opt)}
              >
                <span>{opt.label}</span>
                {opt.value === value && <span aria-hidden>{'✓'}</span>}
              </li>
            ))}
          </ul>
        )}
      </Field>
    );
  },
});
