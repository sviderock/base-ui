import { access } from '../../solid-helpers';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { AccordionItem } from './AccordionItem';
import { AccordionItemDataAttributes } from './AccordionItemDataAttributes';

export const accordionStyleHookMapping: CustomStyleHookMapping<AccordionItem.State> = {
  ...baseMapping,
  index: (value) => {
    return Number.isInteger(access(value))
      ? { [AccordionItemDataAttributes.index]: String(access(value)) }
      : null;
  },
  ...transitionStatusMapping,
  value: () => null,
};
