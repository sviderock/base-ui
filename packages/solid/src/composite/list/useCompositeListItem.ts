'use client';
import type { CompositeMetadata } from '@base-ui-components/solid/composite/list/CompositeList';
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js';
import { useCompositeListContext } from './CompositeListContext';

export interface UseCompositeListItemParameters<Metadata extends Accessor<unknown>> {
  label?: string | null;
  metadata?: Metadata;
  textRef?: HTMLElement | undefined;
  /** Enables guessing the indexes. This avoids a re-render after mount, which is useful for
   * large lists. This should be used for lists that are likely flat and vertical, other cases
   * might trigger a re-render anyway. */
  indexGuessBehavior?: IndexGuessBehavior;
}

interface UseCompositeListItemReturnValue {
  ref: (node: HTMLElement | undefined) => void;
  index: Accessor<number>;
}

export enum IndexGuessBehavior {
  None,
  GuessFromOrder,
}

function initialIndex(
  indexRef: number,
  nextIndex: number,
  setNextIndex: (nextIndex: number) => void,
) {
  if (indexRef === -1) {
    const newIndex = nextIndex;
    setNextIndex(nextIndex + 1);
    indexRef = newIndex;
  }
  return indexRef;
}

/**
 * Used to register a list item and its index (DOM position) in the `CompositeList`.
 */
export function useCompositeListItem<Metadata extends Accessor<unknown>>(
  params: UseCompositeListItemParameters<Metadata>,
): UseCompositeListItemReturnValue {
  const context = useCompositeListContext();
  const indexRef = -1;
  const [index, setIndex] = createSignal<number>(
    params.indexGuessBehavior === IndexGuessBehavior.GuessFromOrder
      ? initialIndex(indexRef, context.nextIndex(), context.setNextIndex)
      : -1,
  );

  const [componentRef, setComponentRef] = createSignal<Element | undefined>();

  function onMapChange(map: Map<Element, CompositeMetadata<Metadata> | null>) {
    const itemRef = componentRef();
    const i = itemRef ? map.get(itemRef)?.index : null;
    if (i != null) {
      setIndex(i);

      if (i !== -1 && itemRef) {
        context.setElements(i, itemRef);

        if (context.labels) {
          const isLabelDefined = params.label !== undefined;
          context.labels[i] = isLabelDefined
            ? params.label!
            : (params.textRef?.textContent ?? itemRef.textContent);
        }
      }
    }
  }

  createEffect(() => {
    const node = componentRef();
    if (node) {
      context.register(node, params.metadata);
      context.subscribeMapChange(onMapChange);
    }

    onCleanup(() => {
      if (node) {
        context.unregister(node);
        context.unsubscribeMapChange(onMapChange);
      }
    });
  });

  return {
    ref: setComponentRef,
    index,
  };
}
