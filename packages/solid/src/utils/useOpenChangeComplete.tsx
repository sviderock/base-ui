'use client';

import { Accessor, createEffect } from 'solid-js';
import { useAnimationsFinished } from './useAnimationsFinished';

/**
 * Calls the provided function when the CSS open/close animation or transition completes.
 */
export function useOpenChangeComplete(parameters: useOpenChangeComplete.Parameters) {
  const enabled = () => parameters.enabled ?? true;
  let openRef = parameters.open?.();
  const runOnceAnimationsFinish = useAnimationsFinished(parameters.ref, parameters.open);

  createEffect(() => {
    if (!enabled()) {
      return;
    }

    runOnceAnimationsFinish(() => {
      if (parameters.open?.() === openRef) {
        parameters.onComplete();
      }
    });
  });
}

export namespace useOpenChangeComplete {
  export interface Parameters {
    /**
     * Whether the hook is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Whether the element is open.
     */
    open?: Accessor<boolean | undefined>;
    /**
     * Ref to the element being closed.
     */
    ref: HTMLElement | null;
    /**
     * Function to call when the animation completes (or there is no animation).
     */
    onComplete: () => void;
  }
}
