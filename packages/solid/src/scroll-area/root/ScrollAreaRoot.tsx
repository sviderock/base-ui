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

  const [viewportRef, setViewportRef] = createSignal<HTMLDivElement>();
  const [scrollbarYRef, setScrollbarYRef] = createSignal<HTMLDivElement>();
  const [scrollbarXRef, setScrollbarXRef] = createSignal<HTMLDivElement>();
  const [thumbYRef, setThumbYRef] = createSignal<HTMLDivElement>();
  const [thumbXRef, setThumbXRef] = createSignal<HTMLDivElement>();
  const [cornerRef, setCornerRef] = createSignal<HTMLDivElement>();

  const [scrollPositionRef, setScrollPositionRef] = createSignal({ x: 0, y: 0 });

  let thumbDraggingRef = false;
  let startYRef = 0;
  let startXRef = 0;
  let startScrollTopRef = 0;
  let startScrollLeftRef = 0;
  let currentOrientationRef: 'vertical' | 'horizontal' = 'vertical';
  const scrollYTimeout = useTimeout();
  const scrollXTimeout = useTimeout();

  const [hiddenState, setHiddenState] = createStore({
    scrollbarYHidden: false,
    scrollbarXHidden: false,
    cornerHidden: false,
  });

  function handleScroll(scrollPosition: { x: number; y: number }) {
    const offsetX = scrollPosition.x - scrollPositionRef().x;
    const offsetY = scrollPosition.y - scrollPositionRef().y;
    setScrollPositionRef(scrollPosition);

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

    const viewportEl = viewportRef();
    const thumbYEl = thumbYRef();
    const thumbXEl = thumbXRef();

    if (viewportEl) {
      startScrollTopRef = viewportEl!.scrollTop;
      startScrollLeftRef = viewportEl!.scrollLeft;
    }

    if (thumbYEl && currentOrientationRef === 'vertical') {
      thumbYEl.setPointerCapture(event.pointerId);
    }
    if (thumbXEl && currentOrientationRef === 'horizontal') {
      thumbXEl.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (!thumbDraggingRef) {
      return;
    }

    const deltaY = event.clientY - startYRef;
    const deltaX = event.clientX - startXRef;

    const viewportEl = viewportRef();
    const scrollbarYEl = scrollbarYRef();
    const scrollbarXEl = scrollbarXRef();
    const thumbYEl = thumbYRef();
    const thumbXEl = thumbXRef();

    if (viewportEl) {
      const scrollableContentHeight = viewportEl.scrollHeight;
      const viewportHeight = viewportEl.clientHeight;
      const scrollableContentWidth = viewportEl.scrollWidth;
      const viewportWidth = viewportEl.clientWidth;

      if (thumbYEl && scrollbarYEl && currentOrientationRef === 'vertical') {
        const scrollbarYOffset = getOffset(scrollbarYEl, 'padding', 'y');
        const thumbYOffset = getOffset(thumbYEl, 'margin', 'y');
        const thumbHeight = thumbYEl.offsetHeight;
        const maxThumbOffsetY =
          scrollbarYEl.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
        const scrollRatioY = deltaY / maxThumbOffsetY;
        viewportEl.scrollTop =
          startScrollTopRef + scrollRatioY * (scrollableContentHeight - viewportHeight);
        event.preventDefault();

        setScrollingY(true);

        scrollYTimeout.start(SCROLL_TIMEOUT, () => {
          setScrollingY(false);
        });
      }

      if (thumbXEl && scrollbarXEl && currentOrientationRef === 'horizontal') {
        const scrollbarXOffset = getOffset(scrollbarXEl, 'padding', 'x');
        const thumbXOffset = getOffset(thumbXEl, 'margin', 'x');
        const thumbWidth = thumbXEl.offsetWidth;
        const maxThumbOffsetX =
          scrollbarXEl.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
        const scrollRatioX = deltaX / maxThumbOffsetX;
        viewportEl.scrollLeft =
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

    const thumbYEl = thumbYRef();
    const thumbXEl = thumbXRef();

    if (thumbYEl && currentOrientationRef === 'vertical') {
      thumbYEl.releasePointerCapture(event.pointerId);
    }
    if (thumbXEl && currentOrientationRef === 'horizontal') {
      thumbXEl.releasePointerCapture(event.pointerId);
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
    setCornerRef,
    scrollingX,
    setScrollingX,
    scrollingY,
    setScrollingY,
    hovering,
    setHovering,
    viewportRef,
    setViewportRef,
    scrollbarYRef,
    setScrollbarYRef,
    scrollbarXRef,
    setScrollbarXRef,
    thumbYRef,
    setThumbYRef,
    thumbXRef,
    setThumbXRef,
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
            // TODO: fix typing
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
