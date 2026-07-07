import { Accordion } from '../recipes/Accordion/Accordion.tsx';

export function AccordionDemo() {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Accordion</h2>
      <Accordion type="single" collapsible className="w-full max-w-xl">
        <Accordion.Item value="item-1">
          <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
          <Accordion.Content>
            Yes. It adheres to the WAI-ARIA design pattern, via Radix's Accordion primitive.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>Is it styled?</Accordion.Trigger>
          <Accordion.Content>
            Yes. It comes with default styles from the recipe's classes, themeable via the
            styles API.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Is it animated?</Accordion.Trigger>
          <Accordion.Content>
            Yes. It's animated by default with the animate-accordion-up/down utilities from
            tw-animate-css, but you can disable it if you prefer.
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
