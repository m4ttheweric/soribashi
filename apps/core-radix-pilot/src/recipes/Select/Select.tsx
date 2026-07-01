/**
 * Select: data-driven, generically-typed form control authored with
 * defineGenericComponent. Mantine data model; react-select-grade inference
 * (Value narrows from data; `multiple` flips value/onChange). Engine: a minimal
 * useCombobox hook + @floating-ui/react positioning. Field wraps it.
 */
import { useId, useMemo, useState, type ReactNode } from 'react';
import { useFloating, offset, flip, shift, size, autoUpdate } from '@floating-ui/react';
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


export const Select = defineGenericComponent<SelectSignature>({
  name: 'Select',
  selectors: ['trigger', 'dropdown', 'option', 'group', 'placeholder', 'pills', 'pill', 'clear'] as const,
  classes,
  render: ({ props }: any) => {
    const reactId = useId();
    const id = props.id ?? reactId;
    const multiple = props.multiple === true;
    const parsed = useMemo(() => parseSelectData(props.data as SelectData<Primitive>), [props.data]);
    const allOptions = useMemo(() => flattenOptions(parsed), [parsed]);

    const [opened, setOpened] = useState(false);
    const [query, setQuery] = useState('');
    const [uncSingle, setUncSingle] = useState<Primitive | null>(props.defaultValue ?? null);
    const [uncMulti, setUncMulti] = useState<Primitive[]>(Array.isArray(props.defaultValue) ? props.defaultValue : []);
    const isControlled = props.value !== undefined;

    const singleValue: Primitive | null = multiple ? null : (isControlled ? (props.value ?? null) : uncSingle);
    const multiValue: Primitive[] = multiple ? (isControlled ? (props.value ?? []) : uncMulti) : [];

    const options = useMemo(
      () => (props.searchable && query ? allOptions.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : allOptions),
      [allOptions, props.searchable, query],
    );

    const { activeIndex, setActiveIndex, onKeyDown } = useCombobox<Primitive>({ options, opened });
    const { refs, floatingStyles } = useFloating({
      open: opened, onOpenChange: setOpened, whileElementsMounted: autoUpdate,
      middleware: [offset(4), flip(), shift({ padding: 8 }), size({ apply({ rects, elements }) { elements.floating.style.width = `${rects.reference.width}px`; } })],
    });

    const close = () => { setOpened(false); setActiveIndex(-1); setQuery(''); };

    const submit = (opt: ComboboxItem<Primitive>) => {
      if (opt.disabled) { return; }
      if (multiple) {
        const has = multiValue.includes(opt.value);
        const nextValues = has ? multiValue.filter((v) => v !== opt.value) : [...multiValue, opt.value];
        const nextOptions = allOptions.filter((o) => nextValues.includes(o.value));
        if (!isControlled) { setUncMulti(nextValues); }
        props.onChange?.(nextValues, nextOptions);
        setQuery('');
      } else {
        if (!isControlled) { setUncSingle(opt.value); }
        props.onChange?.(opt.value, opt);
        close();
      }
    };

    const clear = () => {
      if (multiple) { if (!isControlled) { setUncMulti([]); } props.onChange?.([], []); }
      else { if (!isControlled) { setUncSingle(null); } props.onChange?.(null, null); }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (props.disabled) { return; }
      const r = onKeyDown(e);
      if (r.open) { setOpened(true); }
      if (r.close) { close(); }
      if (r.submit) { submit(r.submit); }
    };

    const selectedSingle = allOptions.find((o) => o.value === singleValue) ?? null;
    const selectedMulti = allOptions.filter((o) => multiValue.includes(o.value));
    const hasValue = multiple ? multiValue.length > 0 : singleValue !== null;

    return (
      <Field id={id} label={props.label} description={props.description} error={props.error} required={props.required}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {multiple && selectedMulti.length > 0 && (
            <span className={classes.pills} data-part="pills">
              {selectedMulti.map((o) => (
                <span key={String(o.value)} className={classes.pill} data-part="pill" data-testid="select-pill">
                  {o.label}
                  <button type="button" aria-label={`Remove ${o.label}`} className={classes.pillRemove}
                    onClick={(e) => { e.stopPropagation(); submit(o); }}>{'×'}</button>
                </span>
              ))}
            </span>
          )}
          <button
            ref={refs.setReference}
            type="button" role="combobox" aria-expanded={opened} aria-controls={`${id}-listbox`}
            aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
            aria-describedby={[props.description ? `${id}-description` : '', props.error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
            aria-invalid={props.error ? true : undefined}
            disabled={props.disabled} data-disabled={props.disabled ? 'true' : undefined}
            className={classes.trigger} data-part="trigger"
            onClick={() => !props.disabled && setOpened((o) => !o)} onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
          >
            {!multiple && selectedSingle ? (
              <span data-part="value">{selectedSingle.label}</span>
            ) : (
              <span className={classes.placeholder} data-part="placeholder">{props.placeholder}</span>
            )}
            <span aria-hidden>{opened ? '▲' : '▼'}</span>
          </button>
          {props.clearable && hasValue && (
            <button type="button" aria-label="Clear" className={classes.clear}
              onClick={(e) => { e.stopPropagation(); clear(); }}>{'×'}</button>
          )}
          {opened && (
            <ul ref={refs.setFloating} id={`${id}-listbox`} role="listbox" className={classes.dropdown} data-part="dropdown" style={floatingStyles}>
              {props.searchable && (
                <li role="presentation">
                  <input role="searchbox" aria-label="Search" autoFocus value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ width: '100%', border: 0, outline: 'none', padding: '0.25rem 0.5rem', background: 'transparent' }} />
                </li>
              )}
              {options.map((opt, i) => {
                const isSel = multiple ? multiValue.includes(opt.value) : opt.value === singleValue;
                return (
                  <li key={String(opt.value)} id={`${id}-opt-${i}`} role="option" aria-selected={isSel} aria-disabled={opt.disabled || undefined}
                    className={classes.option} data-part="option"
                    data-active={i === activeIndex ? 'true' : undefined} data-selected={isSel ? 'true' : undefined}
                    data-disabled={opt.disabled ? 'true' : undefined}
                    onMouseEnter={() => setActiveIndex(i)} onClick={() => submit(opt)}>
                    <span>{opt.label}</span>
                    {isSel && <span aria-hidden>{'✓'}</span>}
                  </li>
                );
              })}
              {options.length === 0 && <li role="presentation" className={classes.group}>Nothing found</li>}
            </ul>
          )}
        </div>
      </Field>
    );
  },
});
