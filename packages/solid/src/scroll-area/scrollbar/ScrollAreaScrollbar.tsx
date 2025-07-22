'use client';
import { Accessor, createEffect, onCleanup, Show, splitProps } from 'solid-js';
import { useDirection } from '../../direction-provider/DirectionContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
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

  const {
    hovering,
    scrollingX,
    scrollingY,
    hiddenState,
    scrollbarYRef,
    scrollbarXRef,
    viewportRef,
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerUp,
    rootId,
    thumbSize,
  } = useScrollAreaRootContext();

  const state: ScrollAreaScrollbar.State = {
    hovering,
    scrolling: () => ({ horizontal: scrollingX(), vertical: scrollingY() })[orientation()],
    orientation,
  };

  const direction = useDirection();

  createEffect(() => {
    const viewportEl = viewportRef;
    const scrollbarEl = orientation() === 'vertical' ? scrollbarYRef : scrollbarXRef;

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
    orientation() === 'vertical' ? hiddenState.scrollbarYHidden : hiddenState.scrollbarXHidden;

  const shouldRender = () => keepMounted() || !isHidden();

  return (
    <Show when={shouldRender()} fallback={null}>
      <ScrollAreaScrollbarContext.Provider value={contextValue}>
        <RenderElement
          element="div"
          componentProps={componentProps}
          ref={useForkRef(
            componentProps.ref,
            orientation() === 'vertical' ? scrollbarYRef : scrollbarXRef,
          )}
          params={{
            state,
            props: [
              {
                ...(rootId() && { 'data-id': `${rootId()}-scrollbar` }),
                onPointerDown(event) {
                  // Ignore clicks on thumb
                  if (event.currentTarget !== event.target) {
                    return;
                  }

                  if (!viewportRef) {
                    return;
                  }

                  // Handle Y-axis (vertical) scroll
                  if (thumbYRef && scrollbarYRef && orientation() === 'vertical') {
                    const thumbYOffset = getOffset(thumbYRef, 'margin', 'y');
                    const scrollbarYOffset = getOffset(scrollbarYRef, 'padding', 'y');
                    const thumbHeight = thumbYRef.offsetHeight;
                    const trackRectY = scrollbarYRef.getBoundingClientRect();
                    const clickY =
                      event.clientY -
                      trackRectY.top -
                      thumbHeight / 2 -
                      scrollbarYOffset +
                      thumbYOffset / 2;

                    const scrollableContentHeight = viewportRef.scrollHeight;
                    const viewportHeight = viewportRef.clientHeight;

                    const maxThumbOffsetY =
                      scrollbarYRef.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
                    const scrollRatioY = clickY / maxThumbOffsetY;
                    const newScrollTop = scrollRatioY * (scrollableContentHeight - viewportHeight);

                    viewportRef.scrollTop = newScrollTop;
                  }

                  if (thumbXRef && scrollbarXRef && orientation() === 'horizontal') {
                    const thumbXOffset = getOffset(thumbXRef, 'margin', 'x');
                    const scrollbarXOffset = getOffset(scrollbarXRef, 'padding', 'x');
                    const thumbWidth = thumbXRef.offsetWidth;
                    const trackRectX = scrollbarXRef.getBoundingClientRect();
                    const clickX =
                      event.clientX -
                      trackRectX.left -
                      thumbWidth / 2 -
                      scrollbarXOffset +
                      thumbXOffset / 2;

                    const scrollableContentWidth = viewportRef.scrollWidth;
                    const viewportWidth = viewportRef.clientWidth;

                    const maxThumbOffsetX =
                      scrollbarXRef.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
                    const scrollRatioX = clickX / maxThumbOffsetX;

                    let newScrollLeft: number;
                    if (direction() === 'rtl') {
                      // In RTL, invert the scroll direction
                      newScrollLeft = (1 - scrollRatioX) * (scrollableContentWidth - viewportWidth);

                      // Adjust for browsers that use negative scrollLeft in RTL
                      if (viewportRef.scrollLeft <= 0) {
                        newScrollLeft = -newScrollLeft;
                      }
                    } else {
                      newScrollLeft = scrollRatioX * (scrollableContentWidth - viewportWidth);
                    }

                    viewportRef.scrollLeft = newScrollLeft;
                  }

                  handlePointerDown(event);
                },
                onPointerUp: handlePointerUp,
                style: {
                  position: 'absolute',
                  'touch-action': 'none',
                  ...(orientation() === 'vertical' && {
                    top: 0,
                    bottom: `var(${ScrollAreaRootCssVars.scrollAreaCornerHeight})`,
                    insetInlineEnd: 0,
                    [ScrollAreaScrollbarCssVars.scrollAreaThumbHeight as string]: `${thumbSize.height}px`,
                  }),
                  ...(orientation() === 'horizontal' && {
                    insetInlineStart: 0,
                    insetInlineEnd: `var(${ScrollAreaRootCssVars.scrollAreaCornerWidth})`,
                    bottom: 0,
                    [ScrollAreaScrollbarCssVars.scrollAreaThumbWidth as string]: `${thumbSize.width}px`,
                  }),
                },
              },
              // TODO: fix typing
              elementProps as any,
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
