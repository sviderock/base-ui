import { onCleanup, onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useScrollAreaViewportContext } from '../viewport/ScrollAreaViewportContext';

/**
 * A container for the content of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaContent(componentProps: ScrollAreaContent.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

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

  const element = useRenderElement('div', componentProps, {
    ref: (el) => {
      contentWrapperRef = el;
    },
    props: [
      {
        role: 'presentation',
        style: {
          'min-width': 'fit-content',
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace ScrollAreaContent {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
