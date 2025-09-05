'use client';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';

export interface CompositeListContextValue<Metadata> {
  register: (node: Element, metadata: Metadata) => void;
  unregister: (node: Element) => void;
  subscribeMapChange: (fn: (map: Map<Element, Metadata | null>) => void) => void;
  unsubscribeMapChange: (fn: Function) => void;
  elements: Store<Array<HTMLElement | null>>;
  setElements: SetStoreFunction<Array<HTMLElement | null>>;
  labels?: Store<Array<string | null>>;
  setLabels?: SetStoreFunction<Array<string | null>>;
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
  elements: [],
  setElements: () => {},
  nextIndex: () => 0,
  setNextIndex: () => {},
});

export function useCompositeListContext() {
  return useContext(CompositeListContext);
}
