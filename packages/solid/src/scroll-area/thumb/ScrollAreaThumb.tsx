'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const rootContext = useScrollAreaRootContext();

  const scrollbarContext = useScrollAreaScrollbarContext();

  const state = createMemo<ScrollAreaThumb.State>(() => ({
    orientation: scrollbarContext.orientation(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      if (scrollbarContext.orientation() === 'vertical') {
        rootContext.refs.thumbYRef = el;
      } else {
        rootContext.refs.thumbXRef = el;
      }
    },
    props: [
      () => ({
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
      }),
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace ScrollAreaThumb {
  export interface State {
    orientation: 'horizontal' | 'vertical';
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
