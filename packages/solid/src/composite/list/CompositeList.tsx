'use client';
import { createEffect, createMemo, createSignal, onCleanup, type JSX } from 'solid-js';
import { useEventCallback } from '../../utils/useEventCallback';
import { CompositeListContext } from './CompositeListContext';

export type CompositeMetadata<CustomMetadata> = { index?: number | null } & CustomMetadata;

/**
 * Provides context for a list of items in a composite component.
 * @internal
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  let nextIndexRef = 0;
  const listeners = createListeners();

  // We use a stable `map` to avoid O(n^2) re-allocation costs for large lists.
  // `mapTick` is our re-render trigger mechanism. We also need to update the
  // elements and label refs, but there's a lot of async work going on and sometimes
  // the effect that handles `onMapChange` gets called after those refs have been
  // filled, and we don't want to lose those values by setting their lengths to `0`.
  // We also need to have them at the proper length because floating-ui uses that
  // information for list navigation.

  const map = createMap<Metadata>;
  const [mapTick, setMapTick] = createSignal(0);
  let lastTickRef = mapTick();

  const register = useEventCallback((node: Element, metadata: Metadata) => {
    map().set(node, metadata ?? null);
    lastTickRef += 1;
    setMapTick(lastTickRef);
  });

  const unregister = useEventCallback((node: Element) => {
    map().delete(node);
    lastTickRef += 1;
    setMapTick(lastTickRef);
  });

  const sortedMap = createMemo(() => {
    // `mapTick` is the `useMemo` trigger as `map` is stable.
    disableEslintWarning(mapTick());

    const newMap = new Map<Element, CompositeMetadata<Metadata>>();
    const sortedNodes = Array.from(map().keys()).sort(sortByDocumentPosition);

    sortedNodes.forEach((node, index) => {
      const metadata = map().get(node) ?? ({} as CompositeMetadata<Metadata>);
      newMap.set(node, { ...metadata, index });
    });

    return newMap;
  });

  createEffect(() => {
    const shouldUpdateLengths = lastTickRef === mapTick();
    if (shouldUpdateLengths) {
      if (props.elementsRef.length !== sortedMap().size) {
        props.elementsRef.length = sortedMap().size;
      }
      if (props.labelsRef && props.labelsRef.length !== sortedMap().size) {
        props.labelsRef.length = sortedMap().size;
      }
    }

    props.onMapChange?.(sortedMap());
  });

  const subscribeMapChange = useEventCallback((fn) => {
    listeners.add(fn);
    onCleanup(() => {
      listeners.delete(fn);
    });
  });

  createEffect(() => {
    listeners.forEach((l) => l(sortedMap()));
  });

  const contextValue = {
    register,
    unregister,
    subscribeMapChange,
    elementsRef: props.elementsRef,
    labelsRef: props.labelsRef,
    nextIndexRef,
  };

  return (
    <CompositeListContext.Provider value={contextValue}>
      {props.children}
    </CompositeListContext.Provider>
  );
}

function createMap<Metadata>() {
  return new Map<Element, CompositeMetadata<Metadata> | null>();
}

function createListeners() {
  return new Set<Function>();
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

function disableEslintWarning(_: any) {}

export namespace CompositeList {
  export interface Props<Metadata> {
    children: JSX.Element;
    /**
     * A ref to the list of HTML elements, ordered by their index.
     * `useListNavigation`'s `listRef` prop.
     */
    elementsRef: Array<HTMLElement | null>;
    /**
     * A ref to the list of element labels, ordered by their index.
     * `useTypeahead`'s `listRef` prop.
     */
    labelsRef?: Array<string | null>;
    onMapChange?: (newMap: Map<Element, CompositeMetadata<Metadata> | null>) => void;
  }
}
