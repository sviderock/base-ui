
import { createEffect, on } from 'solid-js';
import { access, type MaybeAccessor } from '../solid-helpers';
import { useAnimationsFinished } from './useAnimationsFinished';

/**
 * Calls the provided function when the CSS open/close animation or transition completes.
 */
export function useOpenChangeComplete<T extends HTMLElement>(
  parameters: useOpenChangeComplete.Parameters<T>,
) {
  const open = () => access(parameters.open);
  const enabled = () => access(parameters.enabled) ?? true;
  const runOnceAnimationsFinish = useAnimationsFinished(() => access(parameters.ref), open);

  createEffect(
    on([open, enabled], () => {
      if (!enabled()) {
        return;
      }

      runOnceAnimationsFinish(() => {
        parameters.onComplete();
      });
    }),
  );
}

export namespace useOpenChangeComplete {
  export interface Parameters<T extends HTMLElement> {
    /**
     * Whether the hook is enabled.
     * @default true
     */
    enabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the element is open.
     */
    open?: MaybeAccessor<boolean | undefined>;
    /**
     * Ref to the element being closed.
     */
    ref: MaybeAccessor<T | null | undefined>;
    /**
     * Function to call when the animation completes (or there is no animation).
     */
    onComplete: () => void;
  }
}
