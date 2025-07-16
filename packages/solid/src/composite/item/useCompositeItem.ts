'use client';
import { type Accessor, createMemo } from 'solid-js';
import { useForkRef } from '../../utils';
import { HTMLProps } from '../../utils/types';
import { useCompositeListItem } from '../list/useCompositeListItem';
import { useCompositeRootContext } from '../root/CompositeRootContext';

export interface UseCompositeItemParameters<Metadata> {
  metadata?: Accessor<Metadata>;
}

export function useCompositeItem<Metadata>(params: UseCompositeItemParameters<Metadata>) {
  const { highlightedIndex, onHighlightedIndexChange, highlightItemOnHover } =
    useCompositeRootContext();
  const { ref, index } = useCompositeListItem(params);
  const isHighlighted = () => highlightedIndex() === index();

  let itemRef = null as HTMLElement | null;
  const mergedRef = useForkRef(ref, itemRef);

  const props = createMemo<HTMLProps>(() => ({
    tabIndex: isHighlighted() ? 0 : -1,
    onFocus() {
      onHighlightedIndexChange(index());
    },
    onMouseMove() {
      if (!highlightItemOnHover() || !itemRef) {
        return;
      }

      const disabled = itemRef.hasAttribute('disabled') || itemRef.ariaDisabled === 'true';
      if (!isHighlighted() && !disabled) {
        itemRef.focus();
      }
    },
  }));

  return {
    props,
    ref: mergedRef as HTMLElement | null,
    index,
  };
}
