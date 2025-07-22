'use client';
import { Show, splitProps } from 'solid-js';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { RenderElement } from '../../utils/useRenderElement';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';

/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaCorner(componentProps: ScrollAreaCorner.Props) {
  const [, elementProps] = splitProps(componentProps, ['render', 'class']);
  const { cornerRef, cornerSize, hiddenState } = useScrollAreaRootContext();

  return (
    <Show when={!hiddenState.cornerHidden} fallback={null}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={useForkRef(componentProps.ref, cornerRef)}
        params={{
          props: [
            {
              style: {
                position: 'absolute',
                bottom: 0,
                insetInlineEnd: 0,
                width: cornerSize.width,
                height: cornerSize.height,
              },
            },
            // TODO: fix typing
            elementProps as any,
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
