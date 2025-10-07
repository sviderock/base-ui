'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useCompositeItem } from './useCompositeItem';

/**
 * @internal
 */
export function CompositeItem<Metadata>(componentProps: CompositeItem.Props<Metadata>) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['itemRef', 'metadata']);

  const compositeItem = useCompositeItem({ metadata: () => local.metadata });

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={(el) => {
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
        componentProps.itemRef = el;
        compositeItem.setRef(el);
      }}
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
