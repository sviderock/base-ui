import { createMemo } from 'solid-js';
import { EMPTY_OBJECT } from './constants';
import { ownerDocument } from './owner';
import { BaseUIEvent } from './types';

/**
 * Returns `click` and `mousedown` handlers that fix the behavior of triggers of popups that are toggled by different events.
 * For example, a button that opens a popup on mousedown and closes it on click.
 * This hook prevents the popup from closing immediately after the mouse button is released.
 */
export function useMixedToggleClickHandler(params: useMixedToggleClickHandler.Parameters) {
  let ignoreClickRef = false;
  const result = createMemo(
    (): {
      onMouseDown?: (event: MouseEvent) => void;
      onClick?: (event: BaseUIEvent<MouseEvent>) => void;
    } => {
      if (params.enabled ?? true) {
        return {
          onMouseDown: (event) => {
            if (
              (params.mouseDownAction === 'open' && !params.open) ||
              (params.mouseDownAction === 'close' && params.open)
            ) {
              ignoreClickRef = true;

              ownerDocument(event.currentTarget as Element).addEventListener(
                'click',
                () => {
                  ignoreClickRef = false;
                },
                { once: true },
              );
            }
          },
          onClick: (event) => {
            if (ignoreClickRef) {
              ignoreClickRef = false;
              event.preventBaseUIHandler();
            }
          },
        };
      }

      return EMPTY_OBJECT;
    },
  );

  return result;
}

export namespace useMixedToggleClickHandler {
  export interface Parameters {
    /**
     * Whether the mixed toggle click handler is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Determines what action is performed on mousedown.
     */
    mouseDownAction: 'open' | 'close';
    /**
     * The current open state of the popup.
     */
    open: boolean;
  }
}
