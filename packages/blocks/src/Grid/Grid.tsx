import { defineComponent } from '@soribashi/factory';

export interface GridOwnProps {
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface ColOwnProps {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

const GridRoot = defineComponent<GridOwnProps>({
  name: 'Grid',
  selectors: ['root'] as const,
  classes: { root: 'sb-Grid-root' },
  defaults: { columns: 12, gap: 'md' },
  render: ({ props, getStyles }) => {
    const { columns, gap, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-columns={columns} data-gap={gap}>
        {children}
      </div>
    );
  },
});

const GridCol = defineComponent<ColOwnProps>({
  name: 'GridCol',
  selectors: ['root'] as const,
  classes: { root: 'sb-Grid-col' },
  defaults: { span: 1 },
  render: ({ props, getStyles }) => {
    const { span, start, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-span={span} data-start={start}>
        {children}
      </div>
    );
  },
});

export const Grid = Object.assign(GridRoot, { Col: GridCol }) as typeof GridRoot & {
  Col: typeof GridCol;
};
