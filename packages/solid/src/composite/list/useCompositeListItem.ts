'use client';
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js';
import { useCompositeListContext } from './CompositeListContext';

export interface UseCompositeListItemParameters<Metadata> {
  label?: string | null;
  metadata?: Metadata;
  textRef?: HTMLElement | null;
  /** Enables guessing the indexes. This avoids a re-render after mount, which is useful for
   * large lists. This should be used for lists that are likely flat and vertical, other cases
   * might trigger a re-render anyway. */
  indexGuessBehavior?: IndexGuessBehavior;
}

interface UseCompositeListItemReturnValue {
  ref: (node: HTMLElement | null) => void;
  index: Accessor<number>;
}

export enum IndexGuessBehavior {
  None,
  GuessFromOrder,
}

function initialIndex(indexRef: number, nextIndexRef: number) {
  if (indexRef === -1) {
    const newIndex = nextIndexRef;
    nextIndexRef += 1;
    indexRef = newIndex;
  }
  return indexRef;
}

/**
 * Used to register a list item and its index (DOM position) in the `CompositeList`.
 */
export function useCompositeListItem<Metadata>(
  params: UseCompositeListItemParameters<Metadata>,
): UseCompositeListItemReturnValue {
  const { register, unregister, subscribeMapChange, elementsRef, labelsRef, nextIndexRef } =
    useCompositeListContext();

  let indexRef = -1;
  const [index, setIndex] = createSignal<number>(
    params.indexGuessBehavior === IndexGuessBehavior.GuessFromOrder
      ? initialIndex(indexRef, nextIndexRef)
      : -1,
  );

  let componentRef = null as Element | null;

  function ref(node: HTMLElement | null) {
    componentRef = node;

    if (index() !== -1 && node !== null) {
      elementsRef[index()] = node;

      if (labelsRef) {
        const isLabelDefined = params.label !== undefined;
        labelsRef[index()] = isLabelDefined
          ? params.label!
          : (params.textRef?.textContent ?? node.textContent);
      }
    }
  }

  createEffect(() => {
    const node = componentRef;
    if (node) {
      register(node, params.metadata);

      onCleanup(() => {
        unregister(node);
      });
    }
  });

  createEffect(() => {
    onCleanup(() => {
      subscribeMapChange((map) => {
        const i = componentRef ? map.get(componentRef)?.index : null;

        if (i != null) {
          setIndex(i);
        }
      });
    });
  });

  return {
    ref,
    index,
  };
}
