'use client';
import { access, type MaybeAccessor } from '../solid-helpers';
import { useAnimationFrame } from './useAnimationFrame';
import { useTimeout } from './useTimeout';

/**
 * Executes a function once all animations have finished on the provided element.
 * @param ref - The element to watch for animations.
 * @param waitForNextTick - Whether to wait for the next tick before checking for animations.
 */
export function useAnimationsFinished<T extends HTMLElement>(
  ref: T | null | undefined,
  waitForNextTick?: MaybeAccessor<boolean | undefined>,
) {
  const frame = useAnimationFrame();
  const timeout = useTimeout();

  return (
    /**
     * A function to execute once all animations have finished.
     */
    fnToExecute: () => void,
    /**
     * An optional [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that
     * can be used to abort `fnToExecute` before all the animations have finished.
     * @default null
     */
    signal: AbortSignal | null = null,
  ) => {
    frame.cancel();
    timeout.clear();

    if (!ref) {
      return;
    }

    if (typeof ref!.getAnimations !== 'function' || globalThis.BASE_UI_ANIMATIONS_DISABLED) {
      fnToExecute();
    } else {
      frame.request(() => {
        function exec() {
          if (!ref) {
            return;
          }

          Promise.allSettled(ref!.getAnimations().map((anim) => anim.finished)).then(() => {
            if (signal != null && signal.aborted) {
              return;
            }
            // Synchronously flush the unmounting of the component so that the browser doesn't
            // paint: https://github.com/mui/base-ui/issues/979
            fnToExecute();
          });
        }

        // `open: true` animations need to wait for the next tick to be detected
        if (access(waitForNextTick)) {
          timeout.start(0, exec);
        } else {
          exec();
        }
      });
    }
  };
}
