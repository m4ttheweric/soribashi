import { SoribashiProvider } from '@soribashi/factory';
import { createTheme } from '@soribashi/theme';
import { render } from '@testing-library/react';
/**
 * Regression test for the systemic style-merge bug discovered by the V4
 * browser-parity audit: blocks that wrap Box (`<Box {...getStyles('root')} {...rest}>`)
 * leaked the consumer's raw `style` prop AFTER the styles-API merge, overwriting
 * any CSS vars produced by `vars()`. Symptom: `<AspectRatio ratio={16/9} style={{...}}>`
 * rendered with `--ar-ratio: '1'` (the default) instead of `'1.7778'`.
 */
import { describe, expect, it } from 'vitest';
import {
  AspectRatio,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '../../src/index.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Block wrappers preserve vars() output when consumer passes style', () => {
  it('AspectRatio: consumer style does not overwrite --ar-ratio', () => {
    const { container } = wrap(
      <AspectRatio ratio={16 / 9} style={{ width: '200px' }}>
        X
      </AspectRatio>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--ar-ratio')).toBe(String(16 / 9));
    expect(el.style.width).toBe('200px');
  });

  it('Stack: consumer style does not overwrite --stack-gap', () => {
    const { container } = wrap(
      <Stack gap="md" style={{ minHeight: '300px' }}>
        X
      </Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--stack-gap')).toBe('var(--spacing-md)');
    expect(el.style.minHeight).toBe('300px');
  });

  it('Group: consumer style does not overwrite --group-gap', () => {
    const { container } = wrap(
      <Group gap="lg" style={{ outline: '1px solid red' }}>
        X
      </Group>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--group-gap')).toBe('var(--spacing-lg)');
    expect(el.style.outline).toContain('1px');
  });

  it('Paper: consumer style does not overwrite --paper-radius', () => {
    const { container } = wrap(
      <Paper radius="md" style={{ marginTop: '8px' }}>
        X
      </Paper>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--paper-radius')).toBe('var(--radius-md)');
    expect(el.style.marginTop).toBe('8px');
  });

  it('Text: consumer style does not overwrite --text-fz', () => {
    const { container } = wrap(
      <Text size="lg" style={{ marginTop: '4px' }}>
        X
      </Text>,
    );
    const el = container.querySelector('p') as HTMLElement;
    expect(el.style.getPropertyValue('--text-fz')).toBe('var(--font-size-lg)');
    expect(el.style.marginTop).toBe('4px');
  });

  it('Title: consumer style does not overwrite --title-fz', () => {
    const { container } = wrap(
      <Title order={1} style={{ marginTop: '12px' }}>
        X
      </Title>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--title-fz')).toBe('var(--heading-h1-font-size)');
    expect(el.style.marginTop).toBe('12px');
  });

  it('SimpleGrid: consumer style does not overwrite --sg-cols', () => {
    const { container } = wrap(
      <SimpleGrid cols={3} style={{ padding: '20px' }}>
        X
      </SimpleGrid>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--sg-cols')).toBe('3');
    expect(el.style.padding).toBe('20px');
  });

  it('Container: consumer style does not overwrite --container-size', () => {
    const { container } = wrap(
      <Container size="md" style={{ paddingTop: '16px' }}>
        X
      </Container>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue('--container-size')).toBeTruthy();
    expect(el.style.paddingTop).toBe('16px');
  });
});
