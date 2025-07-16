'use client';
import { splitProps } from 'solid-js';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
  const [local, elementProps] = splitProps(componentProps, ['render', 'class', 'ref']);

  const { state } = useAccordionItemContext();

  const element = () =>
    useRenderElement('h3', componentProps, {
      state,
      ref: local.ref,
      props: elementProps,
      customStyleHookMapping: accordionStyleHookMapping,
    });

  return element;
}

export namespace AccordionHeader {
  export interface Props extends BaseUIComponentProps<'h3', AccordionItem.State> {}
}
