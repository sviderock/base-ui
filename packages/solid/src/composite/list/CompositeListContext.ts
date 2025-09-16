'use client';
import { createContext, useContext, type Accessor } from 'solid-js';

export interface CompositeListContextValue<Metadata> {
  register: (node: Element, metadata: Metadata) => void;
  unregister: (node: Element) => void;
  subscribeMapChange: (fn: (map: Map<Element, Metadata | null>) => void) => void;
  unsubscribeMapChange: (fn: Function) => void;
  refs: {
    elements: Array<HTMLElement | null>;
    labels?: Array<string | null>;
  };
  nextIndex: Accessor<number>;
  setNextIndex: (nextIndex: number) => void;
}

export const CompositeListContext = createContext<CompositeListContextValue<any>>({
  register: () => {},
  unregister: () => {},
  subscribeMapChange: () => {
    return () => {};
  },
  unsubscribeMapChange: () => {
    return () => {};
  },
  refs: {
    elements: [],
  },
  nextIndex: () => 0,
  setNextIndex: () => {},
});

export function useCompositeListContext() {
  return useContext(CompositeListContext);
}
