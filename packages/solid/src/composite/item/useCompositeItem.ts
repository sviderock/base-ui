import { createSignal } from 'solid-js';
import type { HTMLProps } from '../../utils/types';
import { useCompositeListItem } from '../list/useCompositeListItem';
import { useCompositeRootContext } from '../root/CompositeRootContext';

export interface UseCompositeItemParameters<Metadata> {
  metadata?: Metadata;
}

export function useCompositeItem<Metadata>(params: UseCompositeItemParameters<Metadata>) {
  const context = useCompositeRootContext();
  const listItem = useCompositeListItem(params);
  const isHighlighted = () => context.highlightedIndex() === listItem.index();
  const [itemRef, setItemRef] = createSignal<HTMLElement | null>(null);

  const props: HTMLProps = {
    get tabIndex() {
      return isHighlighted() ? 0 : -1;
    },
    onFocus() {
      context.onHighlightedIndexChange(listItem.index());
    },
    onMouseMove() {
      if (!context.highlightItemOnHover() || !itemRef()) {
        return;
      }

      const disabled = itemRef()?.hasAttribute('disabled') || itemRef()?.ariaDisabled === 'true';
      if (!isHighlighted() && !disabled) {
        itemRef()?.focus();
      }
    },
  };

  return {
    props,
    index: listItem.index,
    setRef: (el: HTMLElement | null) => {
      setItemRef(el);
      listItem.setRef(el);
    },
  };
}
