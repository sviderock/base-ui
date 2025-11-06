'use client';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStyleHookMapping } from '../item/styleHooks';

/**
 * A heading that labels the corresponding panel.
 * Renders an `<h3>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/solid/components/accordion)
 */
export function AccordionHeader(componentProps: AccordionHeader.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { state } = useAccordionItemContext();
  return (
    <RenderElement
      element="h3"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: state(),
        props: elementProps,
        customStyleHookMapping: accordionStyleHookMapping,
      }}
    />
  );
}

export namespace AccordionHeader {
  export interface Props extends BaseUIComponentProps<'h3', AccordionItem.State> {}
}
