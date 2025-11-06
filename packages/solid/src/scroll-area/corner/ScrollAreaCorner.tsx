'use client';
import { Show } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';

/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaCorner(componentProps: ScrollAreaCorner.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);
  const context = useScrollAreaRootContext();

  return (
    <Show when={!context.hiddenState.cornerHidden} fallback={null}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={(el) => {
          if (typeof componentProps.ref === 'function') {
            componentProps.ref(el);
          } else {
            componentProps.ref = el;
          }
          context.refs.cornerRef = el;
        }}
        params={{
          props: [
            {
              style: {
                position: 'absolute',
                bottom: 0,
                'inset-inline-end': 0,
                width: `${context.cornerSize.width}px`,
                height: `${context.cornerSize.height}px`,
              },
            },
            elementProps,
          ],
        }}
      />
    </Show>
  );
}

export namespace ScrollAreaCorner {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
