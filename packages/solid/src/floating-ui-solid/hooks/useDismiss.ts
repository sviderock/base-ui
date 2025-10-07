import { getOverflowAncestors } from '@floating-ui/dom';
import {
  getComputedStyle,
  getParentNode,
  isElement,
  isHTMLElement,
  isLastTraversableNode,
  isWebKit,
} from '@floating-ui/utils/dom';
import { createEffect, createMemo, onCleanup, type Accessor } from 'solid-js';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { useTimeout } from '../../utils/useTimeout';
import {
  contains,
  getDocument,
  getNodeChildren,
  getTarget,
  isEventTargetInsidePortal,
  isEventTargetWithin,
  isRootElement,
} from '../utils';

/* eslint-disable no-underscore-dangle */

import { useFloatingTree } from '../components/FloatingTree';
import type { ElementProps, FloatingRootContext } from '../types';
import { createAttribute } from '../utils/createAttribute';

const bubbleAndCaptureHandlerKeys = {
  pointerdown: 'on:pointerdown',
  mousedown: 'on:mousedown',
  click: 'on:click',
};

export const normalizeProp = (
  normalizable?: boolean | { escapeKey?: boolean; outsidePress?: boolean },
) => {
  return {
    escapeKey:
      typeof normalizable === 'boolean' ? normalizable : (normalizable?.escapeKey ?? false),
    outsidePress:
      typeof normalizable === 'boolean' ? normalizable : (normalizable?.outsidePress ?? true),
  };
};

export interface UseDismissProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean | undefined>;
  /**
   * Whether to dismiss the floating element upon pressing the `esc` key.
   * @default true
   */
  escapeKey?: MaybeAccessor<boolean | undefined>;
  /**
   * Whether to dismiss the floating element upon pressing the reference
   * element. You likely want to ensure the `move` option in the `useHover()`
   * Hook has been disabled when this is in use.
   * @default false
   */
  referencePress?: MaybeAccessor<boolean | undefined>;
  /**
   * The type of event to use to determine a “press”.
   * - `pointerdown` is eager on both mouse + touch input.
   * - `mousedown` is eager on mouse input, but lazy on touch input.
   * - `click` is lazy on both mouse + touch input.
   * @default 'pointerdown'
   */
  referencePressEvent?: MaybeAccessor<'pointerdown' | 'mousedown' | 'click' | undefined>;
  /**
   * Whether to dismiss the floating element upon pressing outside of the
   * floating element.
   * If you have another element, like a toast, that is rendered outside the
   * floating element’s React tree and don’t want the floating element to close
   * when pressing it, you can guard the check like so:
   * ```jsx
   * useDismiss(context, {
   *   outsidePress: (event) => !event.target.closest('.toast'),
   * });
   * ```
   * @default true
   */
  outsidePress?: boolean | ((event: MouseEvent) => boolean);
  /**
   * The type of event to use to determine an outside “press”.
   * - `pointerdown` is eager on both mouse + touch input.
   * - `mousedown` is eager on mouse input, but lazy on touch input.
   * - `click` is lazy on both mouse + touch input.
   * @default 'pointerdown'
   */
  outsidePressEvent?: MaybeAccessor<'pointerdown' | 'mousedown' | 'click' | undefined>;
  /**
   * Whether to dismiss the floating element upon scrolling an overflow
   * ancestor.
   * @default false
   */
  ancestorScroll?: MaybeAccessor<boolean | undefined>;
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?: MaybeAccessor<boolean | { escapeKey?: boolean; outsidePress?: boolean } | undefined>;
  /**
   * Determines whether to use capture phase event listeners.
   */
  capture?: MaybeAccessor<boolean | { escapeKey?: boolean; outsidePress?: boolean } | undefined>;
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function useDismiss(
  context: FloatingRootContext,
  props: UseDismissProps = {},
): Accessor<ElementProps> {
  const enabled = () => access(props.enabled) ?? true;
  const escapeKey = () => access(props.escapeKey) ?? true;
  const outsidePressEvent = () => access(props.outsidePressEvent) ?? 'pointerdown';
  const referencePress = () => access(props.referencePress) ?? false;
  const referencePressEvent = () => access(props.referencePressEvent) ?? 'pointerdown';
  const ancestorScroll = () => access(props.ancestorScroll) ?? false;

  const outsidePress = createMemo(() => {
    // If it's an event callback
    if (typeof props.outsidePress === 'function') {
      return props.outsidePress;
    }

    return props.outsidePress ?? true;
  });

  const tree = useFloatingTree();

  let endedOrStartedInsideRef = false;
  const bubbles = () => normalizeProp(access(props.bubbles));
  const capture = () => normalizeProp(access(props.capture));

  let isComposingRef = false;

  const closeOnEscapeKeyDown = (event: KeyboardEvent) => {
    if (!event.currentTarget) {
      return;
    }

    if (!context.open() || !enabled() || !escapeKey() || event.key !== 'Escape') {
      return;
    }

    // Wait until IME is settled. Pressing `Escape` while composing should
    // close the compose menu, but not the floating element.
    if (isComposingRef) {
      return;
    }

    const nodeId = context.dataRef.floatingContext?.nodeId();
    const floatingId = context.dataRef.floatingContext?.floatingId();

    const children = tree
      ? getNodeChildren(tree.nodesRef, nodeId)
      : getNodeChildren(context.dataRef.virtualFloatingTree, floatingId);

    let shouldDismiss = true;
    if (children.length > 0) {
      for (const child of children) {
        if (child.context?.open() && !child.context.dataRef.__escapeKeyBubbles) {
          shouldDismiss = false;
          break;
        }
      }
    }

    if (!shouldDismiss) {
      return;
    }

    if (!bubbles().escapeKey) {
      event.stopImmediatePropagation();
    }

    context.dataRef.__closing = true;
    context.onOpenChange(false, event, 'escape-key');
  };

  const closeOnPressOutside = (event: MouseEvent) => {
    // TODO: explanation
    if (!capture().outsidePress && event.cancelBubble) {
      return;
    }

    // When click outside is lazy (`click` event), handle dragging.
    // Don't close if:
    // - The click started inside the floating element.
    // - The click ended inside the floating element.
    const endedOrStartedInside = endedOrStartedInsideRef;
    endedOrStartedInsideRef = false;

    if (outsidePressEvent() === 'click' && endedOrStartedInside) {
      return;
    }

    if (isEventTargetInsidePortal(event)) {
      context.dataRef.insidePortal = true;
      /**
       * TODO: explain this properly
       * If the target is inside a portal OR its dismisal is managed externally then don't dismiss here
       */
      const managed = (event.target as HTMLElement)?.hasAttribute(createAttribute('managed'));

      if (!tree && !managed) {
        return;
      }
    }

    const resolvedOutsidePress = outsidePress();
    if (typeof resolvedOutsidePress === 'function' && !resolvedOutsidePress(event)) {
      return;
    }

    const target = getTarget(event);
    const inertSelector = `[${createAttribute('inert')}]`;
    const markers = getDocument(context.elements.floating()).querySelectorAll(inertSelector);

    let targetRootAncestor = isElement(target) ? target : null;
    while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
      const nextParent = getParentNode(targetRootAncestor);
      if (isLastTraversableNode(nextParent) || !isElement(nextParent)) {
        break;
      }

      targetRootAncestor = nextParent;
    }

    // Check if the click occurred on a third-party element injected after the
    // floating element rendered.
    if (
      markers.length &&
      isElement(target) &&
      !isRootElement(target) &&
      // Clicked on a direct ancestor (e.g. FloatingOverlay).
      !contains(target, context.elements.floating()) &&
      // If the target root element contains none of the markers, then the
      // element was injected after the floating element rendered.
      Array.from(markers).every((marker) => !contains(targetRootAncestor, marker))
    ) {
      return;
    }

    // Check if the click occurred on the scrollbar
    if (isHTMLElement(target)) {
      const lastTraversableNode = isLastTraversableNode(target);
      const style = getComputedStyle(target);
      const scrollRe = /auto|scroll/;
      const isScrollableX = lastTraversableNode || scrollRe.test(style.overflowX);
      const isScrollableY = lastTraversableNode || scrollRe.test(style.overflowY);

      const canScrollX =
        isScrollableX && target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
      const canScrollY =
        isScrollableY && target.clientHeight > 0 && target.scrollHeight > target.clientHeight;

      const isRTL = style.direction === 'rtl';

      // Check click position relative to scrollbar.
      // In some browsers it is possible to change the <body> (or window)
      // scrollbar to the left side, but is very rare and is difficult to
      // check for. Plus, for modal dialogs with backdrops, it is more
      // important that the backdrop is checked but not so much the window.
      const pressedVerticalScrollbar =
        canScrollY &&
        (isRTL
          ? event.offsetX <= target.offsetWidth - target.clientWidth
          : event.offsetX > target.clientWidth);

      const pressedHorizontalScrollbar = canScrollX && event.offsetY > target.clientHeight;

      if (pressedVerticalScrollbar || pressedHorizontalScrollbar) {
        return;
      }
    }

    const nodeId = context.dataRef.floatingContext?.nodeId();

    const targetIsInsideChildren =
      tree &&
      getNodeChildren(tree.nodesRef, nodeId).some((node) =>
        isEventTargetWithin(event, node.context?.elements.floating()),
      );

    if (
      isEventTargetWithin(event, context.elements.floating()) ||
      isEventTargetWithin(event, context.elements.domReference()) ||
      targetIsInsideChildren
    ) {
      return;
    }

    const children = tree ? getNodeChildren(tree.nodesRef, nodeId) : [];

    if (children.length > 0) {
      let shouldDismiss = true;

      children.forEach((child) => {
        if (child.context?.open() && !child.context.dataRef.__outsidePressBubbles) {
          shouldDismiss = false;
        }
      });

      if (!shouldDismiss) {
        return;
      }
    }

    context.onOpenChange(false, event, 'outside-press');
  };

  createEffect(() => {
    if (!context.open() || !enabled()) {
      return;
    }

    context.dataRef.__escapeKeyBubbles = bubbles().escapeKey;
    context.dataRef.__outsidePressBubbles = bubbles().outsidePress;

    const compositionTimeout = useTimeout();

    function onScroll(event: Event) {
      context.onOpenChange(false, event, 'ancestor-scroll');
    }

    function handleCompositionStart() {
      compositionTimeout.clear();
      isComposingRef = true;
    }

    function handleCompositionEnd() {
      // Safari fires `compositionend` before `keydown`, so we need to wait
      // until the next tick to set `isComposing` to `false`.
      // https://bugs.webkit.org/show_bug.cgi?id=165004
      compositionTimeout.start(
        // 0ms or 1ms don't work in Safari. 5ms appears to consistently work.
        // Only apply to WebKit for the test to remain 0ms.
        isWebKit() ? 5 : 0,
        () => {
          isComposingRef = false;
        },
      );
    }

    const floating = context.elements.floating();
    const doc = getDocument(floating);

    if (escapeKey()) {
      doc.addEventListener('keydown', closeOnEscapeKeyDown, capture().escapeKey);
      doc.addEventListener('compositionstart', handleCompositionStart);
      doc.addEventListener('compositionend', handleCompositionEnd);
      onCleanup(() => {
        doc.removeEventListener('keydown', closeOnEscapeKeyDown, capture().escapeKey);
        doc.removeEventListener('compositionstart', handleCompositionStart);
        doc.removeEventListener('compositionend', handleCompositionEnd);
      });
    }

    if (outsidePress()) {
      doc.addEventListener(outsidePressEvent(), closeOnPressOutside, capture().outsidePress);
      onCleanup(() => {
        doc.removeEventListener(outsidePressEvent(), closeOnPressOutside, capture().outsidePress);
      });
    }

    let ancestors: (Element | Window | VisualViewport)[] = [];

    if (ancestorScroll()) {
      const domReference = context.elements.domReference();
      if (isElement(domReference)) {
        ancestors = getOverflowAncestors(domReference);
      }

      const floating = context.elements.floating();
      if (isElement(floating)) {
        ancestors = ancestors.concat(getOverflowAncestors(floating));
      }

      const reference = context.elements.reference();
      if (!isElement(reference) && reference && reference.contextElement) {
        ancestors = ancestors.concat(getOverflowAncestors(reference.contextElement));
      }
    }

    // Ignore the visual viewport for scrolling dismissal (allow pinch-zoom)
    ancestors
      .filter((ancestor) => ancestor !== doc.defaultView?.visualViewport)
      .forEach((ancestor) => {
        ancestor.addEventListener('scroll', onScroll, { passive: true });
        onCleanup(() => ancestor.removeEventListener('scroll', onScroll));
      });

    onCleanup(() => {
      compositionTimeout.clear();
    });
  });

  const reference = createMemo<ElementProps['reference']>(() => ({
    onKeyDown: closeOnEscapeKeyDown,
    ...(referencePress() && {
      [bubbleAndCaptureHandlerKeys[referencePressEvent()]]: (event: Event) => {
        context.onOpenChange(false, event, 'reference-press');
      },
      ...(referencePressEvent() !== 'click' && {
        onClick: (event) => {
          context.onOpenChange(false, event, 'reference-press');
        },
      }),
    }),
  }));

  const floating = createMemo<ElementProps['floating']>(() => {
    return {
      onKeyDown: closeOnEscapeKeyDown,
      onMouseDown: () => {
        endedOrStartedInsideRef = true;
      },
      onMouseUp: () => {
        endedOrStartedInsideRef = true;
      },
    };
  });

  const returnValue = createMemo<ElementProps>(() => {
    if (!enabled()) {
      return {};
    }

    return { reference: reference(), floating: floating() };
  });

  return returnValue;
}
