'use client';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { CodependentRefs } from '../../solid-helpers';
import type { AccordionItem } from './AccordionItem';

export interface AccordionItemContext {
  open: Accessor<boolean>;
  state: AccordionItem.State;
  triggerId?: Accessor<string | undefined>;
  codependentRefs: Store<CodependentRefs<['trigger']>>;
  setCodependentRefs: SetStoreFunction<CodependentRefs<['trigger']>>;
}

export const AccordionItemContext = createContext<AccordionItemContext>();

export function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.',
    );
  }
  return context;
}
