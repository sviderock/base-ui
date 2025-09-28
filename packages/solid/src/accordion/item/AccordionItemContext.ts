'use client';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { AccordionItem } from './AccordionItem';

export interface AccordionItemContext {
  open: Accessor<boolean>;
  state: Accessor<AccordionItem.State>;
  setTriggerId: (id: string | undefined) => void;
  triggerId?: Accessor<string | undefined>;
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
