
import { getWindow, isHTMLElement } from '@floating-ui/utils/dom';
import { createEffect, createMemo, onCleanup, type Accessor } from 'solid-js';
import type { ElementProps, FloatingRootContext } from '../../floating-ui-solid';
import { activeElement, contains, getDocument } from '../../floating-ui-solid/utils';
import { useTimeout } from '../useTimeout';

interface UseFocusWithDelayProps {
  delay?: number;
}

/**
 * Adds support for delay, since Floating UI's `useFocus` hook does not support it.
 */
export function useFocusWithDelay(
  context: FloatingRootContext,
  props: UseFocusWithDelayProps = {},
): Accessor<ElementProps> {
  const timeout = useTimeout();
  let blockFocusRef = false;

  createEffect(() => {
    const domReference = context.elements.domReference();
    const win = getWindow(domReference);

    // If the reference was focused and the user left the tab/window, and the preview card was not
    // open, the focus should be blocked when they return to the tab/window.
    function handleBlur() {
      if (
        !context.open() &&
        isHTMLElement(domReference) &&
        domReference === activeElement(getDocument(domReference))
      ) {
        blockFocusRef = true;
      }
    }

    win.addEventListener('blur', handleBlur);
    onCleanup(() => {
      win.removeEventListener('blur', handleBlur);
    });
  });

  const reference = createMemo<ElementProps['reference']>(() => ({
    onFocus(event) {
      timeout.start(props.delay ?? 0, () => {
        context.onOpenChange(true, event, 'focus');
      });
    },
    onBlur(event) {
      blockFocusRef = false;
      const { relatedTarget } = event;
      const domReference = context.elements.domReference();

      // Wait for the window blur listener to fire.
      timeout.start(0, () => {
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
          contains(domReference, activeEl)
        ) {
          return;
        }

        context.onOpenChange(false, event, 'focus');
      });
    },
  }));

  const returnValue = createMemo<ElementProps>(() => ({ reference: reference() }));

  return returnValue;
}
