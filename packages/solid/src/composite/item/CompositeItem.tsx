'use client';
import { splitProps } from 'solid-js';
import { handleRef } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useCompositeItem } from './useCompositeItem';

/**
 * @internal
 */
export function CompositeItem<Metadata>(componentProps: CompositeItem.Props<Metadata>) {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'itemRef',
    'metadata',
  ]);

  const compositeItem = useCompositeItem({ metadata: () => local.metadata });

  return (
    <RenderElement
      element="div"
      ref={(el) => {
        handleRef(componentProps.ref, el);
        componentProps.itemRef = el;
        compositeItem.setRef(el);
      }}
      componentProps={componentProps}
      params={{ props: [compositeItem.props(), elementProps] }}
    />
  );
}

export namespace CompositeItem {
  export interface State {}

  export interface Props<Metadata> extends Omit<BaseUIComponentProps<'div', State>, 'itemRef'> {
    // the itemRef name collides with https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref
    itemRef?: HTMLElement | null | undefined;
    metadata?: Metadata;
  }
}
