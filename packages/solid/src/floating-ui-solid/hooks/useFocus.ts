import { getWindow, isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { createEffect, createMemo, onCleanup, type Accessor } from 'solid-js';
import { isMac, isSafari } from '../../utils/detectBrowser';
import { useTimeout } from '../../utils/useTimeout';
import {
  activeElement,
  contains,
  getDocument,
  getTarget,
  isTypeableElement,
  matchesFocusVisible,
} from '../utils';

import type { ElementProps, FloatingRootContext, OpenChangeReason } from '../types';
import { createAttribute } from '../utils/createAttribute';

const isMacSafari = isMac && isSafari;

export interface UseFocusProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: Accessor<boolean>;
  /**
   * Whether the open state only changes if the focus event is considered
   * visible (`:focus-visible` CSS selector).
   * @default true
   */
  visibleOnly?: Accessor<boolean>;
}

/**
 * Opens the floating element while the reference element has focus, like CSS
 * `:focus`.
 * @see https://floating-ui.com/docs/useFocus
 */
export function useFocus(
  context: FloatingRootContext,
  props: UseFocusProps = {},
): Accessor<ElementProps> {
  const enabled = () => props.enabled?.() ?? true;
  const visibleOnly = () => props.visibleOnly?.() ?? true;

  let blockFocusRef = false;
  let keyboardModalityRef = true;
  const timeout = useTimeout();

  createEffect(() => {
    if (!enabled()) {
      return;
    }

    const win = getWindow(context.elements.domReference());

    // If the reference was focused and the user left the tab/window, and the
    // floating element was not open, the focus should be blocked when they
    // return to the tab/window.
    function onBlur() {
      const domReference = context.elements.domReference();
      if (
        !context.open() &&
        isHTMLElement(domReference) &&
        domReference === activeElement(getDocument(domReference))
      ) {
        blockFocusRef = true;
      }
    }

    function onKeyDown() {
      keyboardModalityRef = true;
    }

    function onPointerDown() {
      keyboardModalityRef = false;
    }

    win.addEventListener('blur', onBlur);

    if (isMacSafari) {
      win.addEventListener('keydown', onKeyDown, true);
      win.addEventListener('pointerdown', onPointerDown, true);
    }

    onCleanup(() => {
      win.removeEventListener('blur', onBlur);

      if (isMacSafari) {
        win.removeEventListener('keydown', onKeyDown, true);
        win.removeEventListener('pointerdown', onPointerDown, true);
      }
    });
  });

  createEffect(() => {
    if (!enabled()) {
      return;
    }

    function onOpenChangeLocal({ reason }: { reason: OpenChangeReason }) {
      if (reason === 'reference-press' || reason === 'escape-key') {
        blockFocusRef = true;
      }
    }

    context.events.on('openchange', onOpenChangeLocal);
    onCleanup(() => {
      context.events.off('openchange', onOpenChangeLocal);
    });
  });

  const reference = createMemo<ElementProps['reference']>(() => ({
    'on:mouseleave': () => {
      blockFocusRef = false;
    },
    'on:focus': (event) => {
      if (blockFocusRef) {
        return;
      }

      const target = getTarget(event);

      if (visibleOnly() && isElement(target)) {
        // Safari fails to match `:focus-visible` if focus was initially
        // outside the document.
        if (isMacSafari && !event.relatedTarget) {
          if (!keyboardModalityRef && !isTypeableElement(target)) {
            return;
          }
        } else if (!matchesFocusVisible(target)) {
          return;
        }
      }

      context.onOpenChange(true, event, 'focus');
    },
    'on:blur': (event) => {
      blockFocusRef = false;
      const relatedTarget = event.relatedTarget;

      // Hit the non-modal focus management portal guard. Focus will be
      // moved into the floating element immediately after.
      const movedToFocusGuard =
        isElement(relatedTarget) &&
        relatedTarget.hasAttribute(createAttribute('focus-guard')) &&
        relatedTarget.getAttribute('data-type') === 'outside';

      // Wait for the window blur listener to fire.
      timeout.start(0, () => {
        const domReference = context.elements.domReference();
        const activeEl = activeElement(domReference ? domReference.ownerDocument : document);

        // Focus left the page, keep it open.
        if (!relatedTarget && activeEl === domReference) {
          return;
        }

        // When focusing the reference element (e.g. regular click), then
        // clicking into the floating element, prevent it from hiding.
        // Note: it must be focusable, e.g. `tabindex="-1"`.
        // We can not rely on relatedTarget to point to the correct element
        // as it will only point to the shadow host of the newly focused element
        // and not the element that actually has received focus if it is located
        // inside a shadow root.
        if (
          contains(context.dataRef.floatingContext?.refs.floating(), activeEl) ||
          contains(domReference, activeEl) ||
          movedToFocusGuard
        ) {
          return;
        }

        context.onOpenChange(false, event, 'focus');
      });
    },
  }));

  const returnValue = createMemo<ElementProps>(() => {
    if (!enabled()) {
      return {};
    }

    return { reference: reference() };
  });

  return returnValue;
}
