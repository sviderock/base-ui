'use client';
import { batch, createEffect, on, onCleanup, onMount } from 'solid-js';
import { produce } from 'solid-js/store';
import { useDirection } from '../../direction-provider/DirectionContext';
import { splitComponentProps } from '../../solid-helpers';
import { clamp } from '../../utils/clamp';
import { styleDisableScrollbar } from '../../utils/styles';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
  const [, , elementProps] = splitComponentProps(componentProps, []);
  let viewportEl: HTMLDivElement | undefined | null;

  const context = useScrollAreaRootContext();

  const direction = useDirection();

  let programmaticScrollRef = true;
  const scrollEndTimeout = useTimeout();

  function computeThumbPosition() {
    const viewportEl = context.refs.viewportRef;
    const scrollbarXEl = context.refs.scrollbarXRef;
    const scrollbarYEl = context.refs.scrollbarYRef;
    const thumbXEl = context.refs.thumbXRef;
    const thumbYEl = context.refs.thumbYRef;
    const cornerEl = context.refs.cornerRef;

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

    const scrollbarXOffset = getOffset(scrollbarXEl, 'padding', 'x');
    const scrollbarYOffset = getOffset(scrollbarYEl, 'padding', 'y');
    const thumbXOffset = getOffset(thumbXEl, 'margin', 'x');
    const thumbYOffset = getOffset(thumbYEl, 'margin', 'y');

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

    context.setThumbSize((prevSize) => {
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
        context.setCornerSize({ width: 0, height: 0 });
      } else if (!scrollbarXHidden && !scrollbarYHidden) {
        const width = scrollbarYEl?.offsetWidth || 0;
        const height = scrollbarXEl?.offsetHeight || 0;
        context.setCornerSize({ width, height });
      }
    }

    context.setHiddenState(
      produce((state) => {
        state.scrollbarYHidden = scrollbarYHidden;
        state.scrollbarXHidden = scrollbarXHidden;
      }),
    );
  }

  onMount(() => {
    const viewportEl = context.refs.viewportRef;
    if (!viewportEl) {
      return;
    }

    // `onMouseEnter` doesn't fire upon load, so we need to check if the viewport is already
    // being hovered.
    if (viewportEl.matches(':hover')) {
      context.setHovering(true);
    }

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(computeThumbPosition);
      ro.observe(viewportEl);
      onCleanup(() => ro.disconnect());
    }

    const cleanup = onVisible(viewportEl, computeThumbPosition);
    onCleanup(cleanup);
  });

  createEffect(
    on(
      [
        () => context.hiddenState.scrollbarYHidden,
        () => context.hiddenState.scrollbarXHidden,
        direction,
      ],
      () => {
        // Wait for scrollbar-related refs to be set

        queueMicrotask(computeThumbPosition);
      },
    ),
  );

  function handleUserInteraction() {
    programmaticScrollRef = false;
  }

  const contextValue: ScrollAreaViewportContext = {
    computeThumbPosition,
  };

  const element = useRenderElement('div', componentProps, {
    ref: (el) => {
      batch(() => {
        viewportEl = el;
        context.refs.viewportRef = el;
      });
    },
    props: [
      () => ({
        role: 'presentation',
        ...(context.rootId() && { 'data-id': `${context.rootId()}-viewport` }),
        // https://accessibilityinsights.io/info-examples/web/scrollable-region-focusable/
        ...((!context.hiddenState.scrollbarXHidden || !context.hiddenState.scrollbarYHidden) && {
          tabIndex: 0,
        }),
        class: styleDisableScrollbar.class,
        style: {
          overflow: 'scroll',
        },

        onScroll: () => {
          if (!viewportEl) {
            return;
          }

          computeThumbPosition();

          if (!programmaticScrollRef) {
            context.handleScroll({
              x: viewportEl?.scrollLeft,
              y: viewportEl?.scrollTop,
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
      }),
      elementProps,
    ],
  });

  return (
    <ScrollAreaViewportContext.Provider value={contextValue}>
      {element()}
    </ScrollAreaViewportContext.Provider>
  );
}

export namespace ScrollAreaViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
