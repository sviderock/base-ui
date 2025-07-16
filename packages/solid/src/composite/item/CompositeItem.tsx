'use client';
import { mergeProps, splitProps } from 'solid-js';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useCompositeItem } from './useCompositeItem';

/**
 * @internal
 */
export function CompositeItem<Metadata>(componentProps: CompositeItem.Props<Metadata>) {
  const merged = mergeProps(
    { itemRef: null } satisfies CompositeItem.Props<Metadata>,
    componentProps,
  );
  const [local, elementProps] = splitProps(merged, ['render', 'class', 'itemRef', 'metadata']);

  const { props, ref } = useCompositeItem({ metadata: () => local.metadata });

  return useRenderElement('div', componentProps, {
    ref: [local.itemRef, ref],
    props: [props(), elementProps],
  });
}

export namespace CompositeItem {
  export interface State {}

  export interface Props<Metadata> extends Omit<BaseUIComponentProps<'div', State>, 'itemRef'> {
    // the itemRef name collides with https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref
    itemRef?: HTMLElement | null;
    metadata?: Metadata;
  }
}
