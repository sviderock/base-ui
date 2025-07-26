'use client';
import { splitProps, type Accessor } from 'solid-js';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { RenderElement } from '../../utils/useRenderElement';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useScrollAreaScrollbarContext } from '../scrollbar/ScrollAreaScrollbarContext';
import { ScrollAreaScrollbarCssVars } from '../scrollbar/ScrollAreaScrollbarCssVars';

/**
 * The draggable part of the the scrollbar that indicates the current scroll position.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaThumb(componentProps: ScrollAreaThumb.Props) {
  const [, elementProps] = splitProps(componentProps, ['render', 'class']);

  const rootContext = useScrollAreaRootContext();

  const scrollbarContext = useScrollAreaScrollbarContext();

  const state: ScrollAreaThumb.State = { orientation: scrollbarContext.orientation };

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={useForkRef(
        componentProps.ref,
        scrollbarContext.orientation() === 'vertical'
          ? rootContext.setThumbYRef
          : rootContext.setThumbXRef,
      )}
      params={{
        state,
        props: [
          {
            onPointerDown: rootContext.handlePointerDown,
            onPointerMove: rootContext.handlePointerMove,
            onPointerUp(event) {
              if (scrollbarContext.orientation() === 'vertical') {
                rootContext.setScrollingY(false);
              }
              if (scrollbarContext.orientation() === 'horizontal') {
                rootContext.setScrollingX(false);
              }
              rootContext.handlePointerUp(event);
            },
            style: {
              ...(scrollbarContext.orientation() === 'vertical' && {
                height: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbHeight})`,
              }),
              ...(scrollbarContext.orientation() === 'horizontal' && {
                width: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbWidth})`,
              }),
            },
          },
          // TODO: fix typing
          elementProps as any,
        ],
      }}
    />
  );
}

export namespace ScrollAreaThumb {
  export interface State {
    orientation: Accessor<'horizontal' | 'vertical'>;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
