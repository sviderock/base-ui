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

  const {
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setScrollingX,
    setScrollingY,
  } = useScrollAreaRootContext();

  const { orientation } = useScrollAreaScrollbarContext();

  const state: ScrollAreaThumb.State = { orientation };

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={useForkRef(componentProps.ref, orientation() === 'vertical' ? thumbYRef : thumbXRef)}
      params={{
        state,
        props: [
          {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp(event) {
              if (orientation() === 'vertical') {
                setScrollingY(false);
              }
              if (orientation() === 'horizontal') {
                setScrollingX(false);
              }
              handlePointerUp(event);
            },
            style: {
              ...(orientation() === 'vertical' && {
                height: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbHeight})`,
              }),
              ...(orientation() === 'horizontal' && {
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
