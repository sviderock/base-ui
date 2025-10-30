'use client';
import { createSignal, onMount, splitProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import { STYLE_TAG_ID, styleDisableScrollbar } from '../../utils/styles';
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

  const refs: ScrollAreaRootContext['refs'] = {
    viewportRef: null,
    scrollbarYRef: null,
    scrollbarXRef: null,
    thumbYRef: null,
    thumbXRef: null,
    cornerRef: null,
  };

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
    get cornerHidden() {
      return this.scrollbarYHidden || this.scrollbarXHidden;
    },
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

    if (refs.viewportRef) {
      startScrollTopRef = refs.viewportRef.scrollTop;
      startScrollLeftRef = refs.viewportRef.scrollLeft;
    }

    if (refs.thumbYRef && currentOrientationRef === 'vertical') {
      refs.thumbYRef.setPointerCapture(event.pointerId);
    }
    if (refs.thumbXRef && currentOrientationRef === 'horizontal') {
      refs.thumbXRef.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (!thumbDraggingRef) {
      return;
    }

    const deltaY = event.clientY - startYRef;
    const deltaX = event.clientX - startXRef;

    if (refs.viewportRef) {
      const scrollableContentHeight = refs.viewportRef.scrollHeight;
      const viewportHeight = refs.viewportRef.clientHeight;
      const scrollableContentWidth = refs.viewportRef.scrollWidth;
      const viewportWidth = refs.viewportRef.clientWidth;

      if (refs.thumbYRef && refs.scrollbarYRef && currentOrientationRef === 'vertical') {
        const scrollbarYOffset = getOffset(refs.scrollbarYRef, 'padding', 'y');
        const thumbYOffset = getOffset(refs.thumbYRef, 'margin', 'y');
        const thumbHeight = refs.thumbYRef.offsetHeight;
        const maxThumbOffsetY =
          refs.scrollbarYRef.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
        const scrollRatioY = deltaY / maxThumbOffsetY;
        refs.viewportRef.scrollTop =
          startScrollTopRef + scrollRatioY * (scrollableContentHeight - viewportHeight);
        event.preventDefault();

        setScrollingY(true);

        scrollYTimeout.start(SCROLL_TIMEOUT, () => {
          setScrollingY(false);
        });
      }

      if (refs.thumbXRef && refs.scrollbarXRef && currentOrientationRef === 'horizontal') {
        const scrollbarXOffset = getOffset(refs.scrollbarXRef, 'padding', 'x');
        const thumbXOffset = getOffset(refs.thumbXRef, 'margin', 'x');
        const thumbWidth = refs.thumbXRef.offsetWidth;
        const maxThumbOffsetX =
          refs.scrollbarXRef.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
        const scrollRatioX = deltaX / maxThumbOffsetX;
        refs.viewportRef.scrollLeft =
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

    if (refs.thumbYRef && currentOrientationRef === 'vertical') {
      refs.thumbYRef.releasePointerCapture(event.pointerId);
    }
    if (refs.thumbXRef && currentOrientationRef === 'horizontal') {
      refs.thumbXRef.releasePointerCapture(event.pointerId);
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
    refs,
    scrollingX,
    setScrollingX,
    scrollingY,
    setScrollingY,
    hovering,
    setHovering,
    rootId,
    hiddenState,
    setHiddenState,
  };

  onMount(() => {
    if (!document.head.getElementsByTagName('style').namedItem(STYLE_TAG_ID)) {
      document.head.appendChild(styleDisableScrollbar.element as Node);
    }
  });

  return (
    <ScrollAreaRootContext.Provider value={contextValue}>
      <>
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
              elementProps,
            ],
          }}
        />
      </>
    </ScrollAreaRootContext.Provider>
  );
}

export namespace ScrollAreaRoot {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
