'use client';
import { createSignal, splitProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import { styleDisableScrollbar } from '../../utils/styles';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import { SCROLL_TIMEOUT } from '../constants';
import { ScrollAreaScrollbarDataAttributes } from '../scrollbar/ScrollAreaScrollbarDataAttributes';
import { getOffset } from '../utils/getOffset';
import { ScrollAreaRootContext } from './ScrollAreaRootContext';
import { ScrollAreaRootCssVars } from './ScrollAreaRootCssVars';

interface Size {
  width: number;
  height: number;
}

/**
 * Groups all parts of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaRoot(componentProps: ScrollAreaRoot.Props) {
  const [, elementProps] = splitProps(componentProps, ['render', 'class']);

  const [hovering, setHovering] = createSignal(false);
  const [scrollingX, setScrollingX] = createSignal(false);
  const [scrollingY, setScrollingY] = createSignal(false);
  const [cornerSize, setCornerSize] = createStore<Size>({ width: 0, height: 0 });
  const [thumbSize, setThumbSize] = createStore<Size>({ width: 0, height: 0 });
  const [touchModality, setTouchModality] = createSignal(false);

  const rootId = useBaseUiId();

  let viewportRef = null as HTMLDivElement | null;
  let scrollbarYRef = null as HTMLDivElement | null;
  let scrollbarXRef = null as HTMLDivElement | null;
  let thumbYRef = null as HTMLDivElement | null;
  let thumbXRef = null as HTMLDivElement | null;
  let cornerRef = null as HTMLDivElement | null;

  let thumbDraggingRef = false;
  let startYRef = 0;
  let startXRef = 0;
  let startScrollTopRef = 0;
  let startScrollLeftRef = 0;
  let currentOrientationRef: 'vertical' | 'horizontal' = 'vertical';
  const scrollYTimeout = useTimeout();
  const scrollXTimeout = useTimeout();
  let scrollPositionRef = { x: 0, y: 0 };

  const [hiddenState, setHiddenState] = createStore({
    scrollbarYHidden: false,
    scrollbarXHidden: false,
    cornerHidden: false,
  });

  function handleScroll(scrollPosition: { x: number; y: number }) {
    const offsetX = scrollPosition.x - scrollPositionRef.x;
    const offsetY = scrollPosition.y - scrollPositionRef.y;
    scrollPositionRef = scrollPosition;

    if (offsetY !== 0) {
      setScrollingY(true);

      scrollYTimeout.start(SCROLL_TIMEOUT, () => {
        setScrollingY(false);
      });
    }

    if (offsetX !== 0) {
      setScrollingX(true);

      scrollXTimeout.start(SCROLL_TIMEOUT, () => {
        setScrollingX(false);
      });
    }
  }

  function handlePointerDown(event: PointerEvent) {
    thumbDraggingRef = true;
    startYRef = event.clientY;
    startXRef = event.clientX;
    currentOrientationRef = (event.currentTarget as HTMLElement).getAttribute(
      ScrollAreaScrollbarDataAttributes.orientation,
    ) as 'vertical' | 'horizontal';

    if (viewportRef) {
      startScrollTopRef = viewportRef.scrollTop;
      startScrollLeftRef = viewportRef.scrollLeft;
    }
    if (thumbYRef && currentOrientationRef === 'vertical') {
      thumbYRef.setPointerCapture(event.pointerId);
    }
    if (thumbXRef && currentOrientationRef === 'horizontal') {
      thumbXRef.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (!thumbDraggingRef) {
      return;
    }

    const deltaY = event.clientY - startYRef;
    const deltaX = event.clientX - startXRef;

    if (viewportRef) {
      const scrollableContentHeight = viewportRef.scrollHeight;
      const viewportHeight = viewportRef.clientHeight;
      const scrollableContentWidth = viewportRef.scrollWidth;
      const viewportWidth = viewportRef.clientWidth;

      if (thumbYRef && scrollbarYRef && currentOrientationRef === 'vertical') {
        const scrollbarYOffset = getOffset(scrollbarYRef, 'padding', 'y');
        const thumbYOffset = getOffset(thumbYRef, 'margin', 'y');
        const thumbHeight = thumbYRef.offsetHeight;
        const maxThumbOffsetY =
          scrollbarYRef.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
        const scrollRatioY = deltaY / maxThumbOffsetY;
        viewportRef.scrollTop =
          startScrollTopRef + scrollRatioY * (scrollableContentHeight - viewportHeight);
        event.preventDefault();

        setScrollingY(true);

        scrollYTimeout.start(SCROLL_TIMEOUT, () => {
          setScrollingY(false);
        });
      }

      if (thumbXRef && scrollbarXRef && currentOrientationRef === 'horizontal') {
        const scrollbarXOffset = getOffset(scrollbarXRef, 'padding', 'x');
        const thumbXOffset = getOffset(thumbXRef, 'margin', 'x');
        const thumbWidth = thumbXRef.offsetWidth;
        const maxThumbOffsetX =
          scrollbarXRef.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
        const scrollRatioX = deltaX / maxThumbOffsetX;
        viewportRef.scrollLeft =
          startScrollLeftRef + scrollRatioX * (scrollableContentWidth - viewportWidth);
        event.preventDefault();

        setScrollingX(true);

        scrollXTimeout.start(SCROLL_TIMEOUT, () => {
          setScrollingX(false);
        });
      }
    }
  }

  function handlePointerUp(event: PointerEvent) {
    thumbDraggingRef = false;

    if (thumbYRef && currentOrientationRef === 'vertical') {
      thumbYRef.releasePointerCapture(event.pointerId);
    }
    if (thumbXRef && currentOrientationRef === 'horizontal') {
      thumbXRef.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerEnterOrMove(event: PointerEvent) {
    const isTouch = event.pointerType === 'touch';

    setTouchModality(isTouch);

    if (!isTouch) {
      setHovering(true);
    }
  }

  const contextValue = {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScroll,
    cornerSize,
    setCornerSize,
    thumbSize,
    setThumbSize,
    touchModality,
    cornerRef,
    scrollingX,
    setScrollingX,
    scrollingY,
    setScrollingY,
    hovering,
    setHovering,
    viewportRef,
    scrollbarYRef,
    scrollbarXRef,
    thumbYRef,
    thumbXRef,
    rootId,
    hiddenState,
    setHiddenState,
  };

  return (
    <ScrollAreaRootContext.Provider value={contextValue}>
      {styleDisableScrollbar.element}
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{
          // TODO: fix typing
          props: [
            {
              role: 'presentation',
              onPointerEnter: handlePointerEnterOrMove,
              onPointerMove: handlePointerEnterOrMove,
              onPointerDown(event) {
                setTouchModality(event.pointerType === 'touch');
              },
              onPointerLeave() {
                setHovering(false);
              },
              style: {
                position: 'relative',
                [ScrollAreaRootCssVars.scrollAreaCornerHeight as string]: `${cornerSize.height}px`,
                [ScrollAreaRootCssVars.scrollAreaCornerWidth as string]: `${cornerSize.width}px`,
              },
            },
            elementProps as any,
          ],
        }}
      />
    </ScrollAreaRootContext.Provider>
  );
}

export namespace ScrollAreaRoot {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
