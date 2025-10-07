'use client';
import { onCleanup, onMount, splitProps } from 'solid-js';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useScrollAreaViewportContext } from '../viewport/ScrollAreaViewportContext';

/**
 * A container for the content of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaContent(componentProps: ScrollAreaContent.Props) {
  const [, elementProps] = splitProps(componentProps, ['render', 'class']);

  let contentWrapperRef: HTMLDivElement | null | undefined;

  const context = useScrollAreaViewportContext();

  onMount(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const ro = new ResizeObserver(context.computeThumbPosition);

    if (contentWrapperRef) {
      ro.observe(contentWrapperRef);
    }

    onCleanup(() => {
      ro.disconnect();
    });
  });

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
        contentWrapperRef = el;
      }}
      params={{
        props: [
          {
            role: 'presentation',
            style: {
              'min-width': 'fit-content',
            },
          },
          elementProps,
        ],
      }}
    />
  );
}

export namespace ScrollAreaContent {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
