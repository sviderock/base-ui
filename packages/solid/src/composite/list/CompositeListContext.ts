'use client';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';

export interface CompositeListContextValue<Metadata> {
  register: (node: Element, metadata: Metadata) => void;
  unregister: (node: Element) => void;
  subscribeMapChange: (fn: (map: Map<Element, Metadata | null>) => void) => void;
  unsubscribeMapChange: (fn: Function) => void;
  elements: Store<Array<HTMLElement | undefined>>;
  setElements: SetStoreFunction<Array<HTMLElement | undefined>>;
  labels?: Store<Array<string | null> | undefined>;
  setLabels?: SetStoreFunction<Array<string | null> | undefined>;
  nextIndex: Accessor<number>;
  setNextIndex: (nextIndex: number) => void;
}

export const CompositeListContext = createContext<CompositeListContextValue<any>>();

export function useCompositeListContext() {
  const context = useContext(CompositeListContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: CompositeListContext is missing. Composite parts must be placed within <Composite.List>.',
    );
  }

  return context;
}
