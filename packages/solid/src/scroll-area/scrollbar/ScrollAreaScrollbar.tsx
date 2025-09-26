'use client';
import { Accessor, createEffect, onCleanup, Show, splitProps } from 'solid-js';
import { useDirection } from '../../direction-provider/DirectionContext';
import { handleRef } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { ScrollAreaRootCssVars } from '../root/ScrollAreaRootCssVars';
import { getOffset } from '../utils/getOffset';
import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext';
import { ScrollAreaScrollbarCssVars } from './ScrollAreaScrollbarCssVars';
/**
 * A vertical or horizontal scrollbar for the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaScrollbar(componentProps: ScrollAreaScrollbar.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'orientation',
    'keepMounted',
  ]);
  const orientation = () => local.orientation ?? 'vertical';
  const keepMounted = () => local.keepMounted ?? false;

  const context = useScrollAreaRootContext();

  const state: ScrollAreaScrollbar.State = {
    hovering: context.hovering,
    scrolling: () =>
      ({ horizontal: context.scrollingX(), vertical: context.scrollingY() })[orientation()],
    orientation,
  };

  const direction = useDirection();

  createEffect(() => {
    const viewportEl = context.refs.viewportRef;
    const scrollbarEl =
      orientation() === 'vertical' ? context.refs.scrollbarYRef : context.refs.scrollbarXRef;

    if (!scrollbarEl) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      if (!viewportEl || !scrollbarEl || event.ctrlKey) {
        return;
      }

      event.preventDefault();

      if (orientation() === 'vertical') {
        if (viewportEl.scrollTop === 0 && event.deltaY < 0) {
          return;
        }
      } else if (viewportEl.scrollLeft === 0 && event.deltaX < 0) {
        return;
      }

      if (orientation() === 'vertical') {
        if (
          viewportEl.scrollTop === viewportEl.scrollHeight - viewportEl.clientHeight &&
          event.deltaY > 0
        ) {
          return;
        }
      } else if (
        viewportEl.scrollLeft === viewportEl.scrollWidth - viewportEl.clientWidth &&
        event.deltaX > 0
      ) {
        return;
      }

      if (orientation() === 'vertical') {
        viewportEl.scrollTop += event.deltaY;
      } else {
        viewportEl.scrollLeft += event.deltaX;
      }
    }

    scrollbarEl.addEventListener('wheel', handleWheel, { passive: false });

    onCleanup(() => {
      scrollbarEl.removeEventListener('wheel', handleWheel);
    });
  });

  const contextValue: ScrollAreaScrollbarContext = { orientation };

  const isHidden = () =>
    orientation() === 'vertical'
      ? context.hiddenState.scrollbarYHidden
      : context.hiddenState.scrollbarXHidden;

  const shouldRender = () => keepMounted() || !isHidden();

  return (
    <Show when={shouldRender()} fallback={null}>
      <ScrollAreaScrollbarContext.Provider value={contextValue}>
        <RenderElement
          element="div"
          componentProps={componentProps}
          ref={(el) => {
            handleRef(componentProps.ref, el);
            if (orientation() === 'vertical') {
              context.refs.scrollbarYRef = el;
            } else {
              context.refs.scrollbarXRef = el;
            }
          }}
          params={{
            state,
            props: [
              {
                ...(context.rootId() && { 'data-id': `${context.rootId()}-scrollbar` }),
                onPointerDown(event) {
                  // Ignore clicks on thumb
                  if (event.currentTarget !== event.target) {
                    return;
                  }

                  const viewportEl = context.refs.viewportRef;
                  const thumbYEl = context.refs.thumbYRef;
                  const scrollbarYEl = context.refs.scrollbarYRef;
                  const thumbXEl = context.refs.thumbXRef;
                  const scrollbarXEl = context.refs.scrollbarXRef;

                  if (!viewportEl) {
                    return;
                  }

                  // Handle Y-axis (vertical) scroll
                  if (thumbYEl && scrollbarYEl && orientation() === 'vertical') {
                    const thumbYOffset = getOffset(thumbYEl, 'margin', 'y');
                    const scrollbarYOffset = getOffset(scrollbarYEl, 'padding', 'y');
                    const thumbHeight = thumbYEl.offsetHeight;
                    const trackRectY = scrollbarYEl.getBoundingClientRect();
                    const clickY =
                      event.clientY -
                      trackRectY.top -
                      thumbHeight / 2 -
                      scrollbarYOffset +
                      thumbYOffset / 2;

                    const scrollableContentHeight = viewportEl.scrollHeight;
                    const viewportHeight = viewportEl.clientHeight;

                    const maxThumbOffsetY =
                      scrollbarYEl.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
                    const scrollRatioY = clickY / maxThumbOffsetY;
                    const newScrollTop = scrollRatioY * (scrollableContentHeight - viewportHeight);

                    viewportEl.scrollTop = newScrollTop;
                  }

                  if (thumbXEl && scrollbarXEl && orientation() === 'horizontal') {
                    const thumbXOffset = getOffset(thumbXEl, 'margin', 'x');
                    const scrollbarXOffset = getOffset(scrollbarXEl, 'padding', 'x');
                    const thumbWidth = thumbXEl.offsetWidth;
                    const trackRectX = scrollbarXEl.getBoundingClientRect();
                    const clickX =
                      event.clientX -
                      trackRectX.left -
                      thumbWidth / 2 -
                      scrollbarXOffset +
                      thumbXOffset / 2;

                    const scrollableContentWidth = viewportEl.scrollWidth;
                    const viewportWidth = viewportEl.clientWidth;

                    const maxThumbOffsetX =
                      scrollbarXEl.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
                    const scrollRatioX = clickX / maxThumbOffsetX;

                    let newScrollLeft: number;
                    if (direction() === 'rtl') {
                      // In RTL, invert the scroll direction
                      newScrollLeft = (1 - scrollRatioX) * (scrollableContentWidth - viewportWidth);

                      // Adjust for browsers that use negative scrollLeft in RTL
                      if (viewportEl.scrollLeft <= 0) {
                        newScrollLeft = -newScrollLeft;
                      }
                    } else {
                      newScrollLeft = scrollRatioX * (scrollableContentWidth - viewportWidth);
                    }

                    viewportEl.scrollLeft = newScrollLeft;
                  }

                  context.handlePointerDown(event);
                },
                onPointerUp: context.handlePointerUp,
                style: {
                  position: 'absolute',
                  'touch-action': 'none',
                  ...(orientation() === 'vertical' && {
                    top: 0,
                    bottom: `var(${ScrollAreaRootCssVars.scrollAreaCornerHeight})`,
                    'inset-inline-end': 0,
                    [ScrollAreaScrollbarCssVars.scrollAreaThumbHeight as string]: `${context.thumbSize.height}px`,
                  }),
                  ...(orientation() === 'horizontal' && {
                    'inset-inline-start': 0,
                    'inset-inline-end': `var(${ScrollAreaRootCssVars.scrollAreaCornerWidth})`,
                    bottom: 0,
                    [ScrollAreaScrollbarCssVars.scrollAreaThumbWidth as string]: `${context.thumbSize.width}px`,
                  }),
                },
              },
              elementProps,
            ],
          }}
        />
      </ScrollAreaScrollbarContext.Provider>
    </Show>
  );
}

export namespace ScrollAreaScrollbar {
  export interface State {
    hovering: Accessor<boolean>;
    scrolling: Accessor<boolean>;
    orientation: Accessor<'vertical' | 'horizontal'>;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the scrollbar controls vertical or horizontal scroll.
     * @default 'vertical'
     */
    orientation?: 'vertical' | 'horizontal';
    /**
     * Whether to keep the HTML element in the DOM when the viewport isn’t scrollable.
     * @default false
     */
    keepMounted?: boolean;
  }
}
