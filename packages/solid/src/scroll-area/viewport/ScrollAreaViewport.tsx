'use client';
import { createEffect, onCleanup, splitProps } from 'solid-js';
import { useDirection } from '../../direction-provider/DirectionContext';
import { clamp } from '../../utils/clamp';
import { styleDisableScrollbar } from '../../utils/styles';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { RenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import { MIN_THUMB_SIZE } from '../constants';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { getOffset } from '../utils/getOffset';
import { onVisible } from '../utils/onVisible';
import { ScrollAreaViewportContext } from './ScrollAreaViewportContext';

/**
 * The actual scrollable container of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaViewport(componentProps: ScrollAreaViewport.Props) {
  const [, elementProps] = splitProps(componentProps, ['render', 'class']);

  const {
    viewportRef,
    scrollbarYRef,
    scrollbarXRef,
    thumbYRef,
    thumbXRef,
    cornerRef,
    setCornerSize,
    setThumbSize,
    rootId,
    setHiddenState,
    hiddenState,
    handleScroll,
    setHovering,
  } = useScrollAreaRootContext();

  const direction = useDirection();

  let programmaticScrollRef = true;
  const scrollEndTimeout = useTimeout();

  function computeThumbPosition() {
    const viewportEl = viewportRef;
    const scrollbarYEl = scrollbarYRef;
    const scrollbarXEl = scrollbarXRef;
    const thumbYEl = thumbYRef;
    const thumbXEl = thumbXRef;
    const cornerEl = cornerRef;

    if (!viewportEl) {
      return;
    }

    const scrollableContentHeight = viewportEl.scrollHeight;
    const scrollableContentWidth = viewportEl.scrollWidth;
    const viewportHeight = viewportEl.clientHeight;
    const viewportWidth = viewportEl.clientWidth;
    const scrollTop = viewportEl.scrollTop;
    const scrollLeft = viewportEl.scrollLeft;

    if (scrollableContentHeight === 0 || scrollableContentWidth === 0) {
      return;
    }

    const scrollbarYHidden = viewportHeight >= scrollableContentHeight;
    const scrollbarXHidden = viewportWidth >= scrollableContentWidth;
    const ratioX = viewportWidth / scrollableContentWidth;
    const ratioY = viewportHeight / scrollableContentHeight;
    const nextWidth = scrollbarXHidden ? 0 : viewportWidth;
    const nextHeight = scrollbarYHidden ? 0 : viewportHeight;

    const scrollbarXOffset = getOffset(scrollbarXEl!, 'padding', 'x');
    const scrollbarYOffset = getOffset(scrollbarYEl!, 'padding', 'y');
    const thumbXOffset = getOffset(thumbXEl!, 'margin', 'x');
    const thumbYOffset = getOffset(thumbYEl!, 'margin', 'y');

    const idealNextWidth = nextWidth - scrollbarXOffset - thumbXOffset;
    const idealNextHeight = nextHeight - scrollbarYOffset - thumbYOffset;

    const maxNextWidth = scrollbarXEl
      ? Math.min(scrollbarXEl.offsetWidth, idealNextWidth)
      : idealNextWidth;
    const maxNextHeight = scrollbarYEl
      ? Math.min(scrollbarYEl.offsetHeight, idealNextHeight)
      : idealNextHeight;

    const clampedNextWidth = Math.max(MIN_THUMB_SIZE, maxNextWidth * ratioX);
    const clampedNextHeight = Math.max(MIN_THUMB_SIZE, maxNextHeight * ratioY);

    setThumbSize((prevSize) => {
      if (prevSize.height === clampedNextHeight && prevSize.width === clampedNextWidth) {
        return prevSize;
      }

      return {
        width: clampedNextWidth,
        height: clampedNextHeight,
      };
    });

    // Handle Y (vertical) scroll
    if (scrollbarYEl && thumbYEl) {
      const maxThumbOffsetY =
        scrollbarYEl.offsetHeight - clampedNextHeight - scrollbarYOffset - thumbYOffset;
      const scrollRatioY = scrollTop / (scrollableContentHeight - viewportHeight);

      // In Safari, don't allow it to go negative or too far as `scrollTop` considers the rubber
      // band effect.
      const thumbOffsetY = Math.min(maxThumbOffsetY, Math.max(0, scrollRatioY * maxThumbOffsetY));

      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`;
    }

    // Handle X (horizontal) scroll
    if (scrollbarXEl && thumbXEl) {
      const maxThumbOffsetX =
        scrollbarXEl.offsetWidth - clampedNextWidth - scrollbarXOffset - thumbXOffset;
      const scrollRatioX = scrollLeft / (scrollableContentWidth - viewportWidth);

      // In Safari, don't allow it to go negative or too far as `scrollLeft` considers the rubber
      // band effect.
      const thumbOffsetX =
        direction() === 'rtl'
          ? clamp(scrollRatioX * maxThumbOffsetX, -maxThumbOffsetX, 0)
          : clamp(scrollRatioX * maxThumbOffsetX, 0, maxThumbOffsetX);

      thumbXEl.style.transform = `translate3d(${thumbOffsetX}px,0,0)`;
    }

    if (cornerEl) {
      if (scrollbarXHidden || scrollbarYHidden) {
        setCornerSize({ width: 0, height: 0 });
      } else if (!scrollbarXHidden && !scrollbarYHidden) {
        const width = scrollbarYEl?.offsetWidth || 0;
        const height = scrollbarXEl?.offsetHeight || 0;
        setCornerSize({ width, height });
      }
    }

    setHiddenState((prevState) => {
      const cornerHidden = scrollbarYHidden || scrollbarXHidden;

      if (
        prevState.scrollbarYHidden === scrollbarYHidden &&
        prevState.scrollbarXHidden === scrollbarXHidden &&
        prevState.cornerHidden === cornerHidden
      ) {
        return prevState;
      }

      return {
        scrollbarYHidden,
        scrollbarXHidden,
        cornerHidden,
      };
    });
  }

  createEffect(() => {
    if (!viewportRef) {
      return;
    }

    onCleanup(() => {
      onVisible(viewportRef, computeThumbPosition);
    });
  });

  createEffect(() => {
    // Wait for scrollbar-related refs to be set
    queueMicrotask(computeThumbPosition);
  });

  createEffect(() => {
    // `onMouseEnter` doesn't fire upon load, so we need to check if the viewport is already
    // being hovered.
    if (viewportRef?.matches(':hover')) {
      setHovering(true);
    }
  });

  createEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const ro = new ResizeObserver(computeThumbPosition);

    if (viewportRef) {
      ro.observe(viewportRef);
    }

    onCleanup(() => {
      ro.disconnect();
    });
  });

  function handleUserInteraction() {
    programmaticScrollRef = false;
  }

  const contextValue: ScrollAreaViewportContext = {
    computeThumbPosition,
  };

  return (
    <ScrollAreaViewportContext.Provider value={contextValue}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={useForkRef(componentProps.ref, viewportRef)}
        params={{
          props: [
            {
              role: 'presentation',
              ...(rootId() && { 'data-id': `${rootId()}-viewport` }),
              // https://accessibilityinsights.io/info-examples/web/scrollable-region-focusable/
              ...((!hiddenState.scrollbarXHidden || !hiddenState.scrollbarYHidden) && {
                tabIndex: 0,
              }),
              class: styleDisableScrollbar.class,
              style: {
                overflow: 'scroll',
              },
              onScroll() {
                if (!viewportRef) {
                  return;
                }

                computeThumbPosition();

                if (!programmaticScrollRef) {
                  handleScroll({
                    x: viewportRef.scrollLeft,
                    y: viewportRef.scrollTop,
                  });
                }

                // Debounce the restoration of the programmatic flag so that it only
                // flips back to `true` once scrolling has come to a rest. This ensures
                // that momentum scrolling (where no further user-interaction events fire)
                // is still treated as user-driven.
                // 100 ms without scroll events ≈ scroll end
                // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event
                scrollEndTimeout.start(100, () => {
                  programmaticScrollRef = true;
                });
              },
              onWheel: handleUserInteraction,
              onTouchMove: handleUserInteraction,
              onPointerMove: handleUserInteraction,
              onPointerEnter: handleUserInteraction,
              onKeyDown: handleUserInteraction,
            },
            // TODO: fix typing
            elementProps as any,
          ],
        }}
      />
    </ScrollAreaViewportContext.Provider>
  );
}

export namespace ScrollAreaViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
