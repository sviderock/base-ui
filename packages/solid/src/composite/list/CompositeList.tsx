'use client';
import { createEffect, createMemo, createSignal, createUniqueId, type JSX } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { CompositeListContext } from './CompositeListContext';

export type CompositeMetadata<CustomMetadata> = { index?: number | null } & CustomMetadata;
type NodeId = string;

/**
 * Provides context for a list of items in a composite component.
 * @internal
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const [nextIndex, setNextIndex] = createSignal(0);
  const [store, setStore] = createStore({
    internalMap: new Map<Element, { uid: NodeId; metadata: CompositeMetadata<Metadata> | null }>(),
    internalNodeIdMap: {} as Record<NodeId, Element>,
    listeners: [] as Function[],
  });

  const map = createMemo(() => {
    const entries = Object.values(store.internalNodeIdMap).map(
      (node) => [node, store.internalMap.get(node)?.metadata ?? null] as const,
    );
    return new Map<Element, CompositeMetadata<Metadata> | null>(entries);
  });

  const sortedMap = createMemo(() => {
    const newMap = new Map<Element, CompositeMetadata<Metadata>>();
    const sortedNodes = Array.from(map().keys()).sort(sortByDocumentPosition);

    sortedNodes.forEach((node, index) => {
      const metadata = map().get(node) ?? ({} as CompositeMetadata<Metadata>);
      newMap.set(node, { ...metadata, index });
    });

    return newMap;
  });

  function register(node: Element, metadata: Metadata) {
    const uid = store.internalMap.get(node)?.uid ?? createUniqueId();
    setStore(
      produce((currentState) => {
        currentState.internalMap.set(node, { uid, metadata: metadata ?? null });
        currentState.internalNodeIdMap[uid] = node;
      }),
    );
  }

  function unregister(node: Element) {
    const uid = store.internalMap.get(node)?.uid;
    if (uid) {
      setStore(
        produce((currentState) => {
          currentState.internalMap.delete(node);
          delete currentState.internalNodeIdMap[uid];
        }),
      );
    }
  }

  createEffect(() => {
    props.onMapChange?.(sortedMap());
  });

  function subscribeMapChange(fn: Function) {
    setStore(
      produce((currentState) => {
        if (currentState.listeners.includes(fn) === false) {
          currentState.listeners.push(fn);
        }
      }),
    );
  }

  function unsubscribeMapChange(fn: Function) {
    setStore(
      produce((currentState) => {
        const index = currentState.listeners.indexOf(fn);
        if (index !== -1) {
          currentState.listeners.splice(index, 1);
        }
      }),
    );
  }

  createEffect(() => {
    store.listeners.forEach((l) => l(sortedMap()));
  });

  return (
    <CompositeListContext.Provider
      value={{
        register,
        unregister,
        subscribeMapChange,
        unsubscribeMapChange,
        // eslint-disable-next-line solid/reactivity
        refs: props.refs,
        nextIndex,
        setNextIndex,
      }}
    >
      {props.children}
    </CompositeListContext.Provider>
  );
}

function sortByDocumentPosition(a: Element, b: Element) {
  const position = a.compareDocumentPosition(b);

  if (
    position & Node.DOCUMENT_POSITION_FOLLOWING ||
    position & Node.DOCUMENT_POSITION_CONTAINED_BY
  ) {
    return -1;
  }

  if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
    return 1;
  }

  return 0;
}

export namespace CompositeList {
  export interface Props<Metadata> {
    children: JSX.Element;
    refs: {
      /**
       * A ref to the list of HTML elements, ordered by their index.
       * `useListNavigation`'s `listRef` prop.
       */
      elements: Array<HTMLElement | null | undefined>;
      /**
       * A ref to the list of element labels, ordered by their index.
       * `useTypeahead`'s `listRef` prop.
       */
      labels?: Array<string | null>;
    };

    onMapChange?: (newMap: Map<Element, CompositeMetadata<Metadata> | null>) => void;
  }
}
