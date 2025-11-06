'use client';
import { batch } from 'solid-js';
import { access, type MaybeAccessor, splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useCompositeItem } from './useCompositeItem';

/**
 * @internal
 */
export function CompositeItem<Metadata>(componentProps: CompositeItem.Props<Metadata>) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['refs', 'metadata']);
  const metadata = () => access(local.metadata);

  const compositeItem = useCompositeItem({ metadata });

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={(el) => {
        batch(() => {
          if (typeof componentProps.ref === 'function') {
            componentProps.ref(el);
          } else {
            componentProps.ref = el;
          }
          if (componentProps.refs) {
            componentProps.refs.itemRef = el;
          }
          compositeItem.setRef(el);
        });
      }}
      params={{ props: [compositeItem.props(), elementProps] }}
    />
  );
}

export namespace CompositeItem {
  export interface State {}

  export interface Props<Metadata> extends BaseUIComponentProps<'div', State> {
    // the itemRef name collides with https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref
    refs?: {
      itemRef?: HTMLElement | null | undefined;
    };
    metadata?: MaybeAccessor<Metadata | undefined>;
  }
}
