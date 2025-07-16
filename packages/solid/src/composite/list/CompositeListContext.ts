'use client';
import { createContext, useContext } from 'solid-js';

export interface CompositeListContextValue<Metadata> {
  register: (node: Element, metadata: Metadata) => void;
  unregister: (node: Element) => void;
  subscribeMapChange: (fn: (map: Map<Element, Metadata | null>) => void) => void;
  elementsRef: Array<HTMLElement | null>;
  labelsRef?: Array<string | null>;
  nextIndexRef: number;
}

export const CompositeListContext = createContext<CompositeListContextValue<any>>({
  register: () => {},
  unregister: () => {},
  subscribeMapChange: () => {
    return () => {};
  },
  elementsRef: [],
  nextIndexRef: 0,
});

export function useCompositeListContext() {
  return useContext(CompositeListContext);
}
