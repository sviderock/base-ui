'use client';
import { createEffect, createRenderEffect, onCleanup, type Accessor } from 'solid-js';
import { createStore } from 'solid-js/store';
import { AnimationFrame } from './useAnimationFrame';

export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined;

/**
 * Provides a status string for CSS animations.
 * @param open - an accessor to a boolean that determines if the element is open.
 * @param enableIdleState - a boolean that enables the `'idle'` state between `'starting'` and `'ending'`
 */
export function useTransitionStatus(
  open: Accessor<boolean>,
  enableIdleState: boolean = false,
  deferEndingState: boolean = false,
) {
  const [state, setState] = createStore<{ mounted: boolean; transitionStatus: TransitionStatus }>({
    mounted: open(),
    transitionStatus: open() && enableIdleState ? 'idle' : undefined,
  });

  createEffect(() => {
    setState((prev) => {
      if (open() && !prev.mounted) {
        return { mounted: true, transitionStatus: 'starting' };
      }

      if (!open() && prev.mounted && prev.transitionStatus !== 'ending' && !deferEndingState) {
        return { ...prev, transitionStatus: 'ending' };
      }

      if (!open() && !prev.mounted && prev.transitionStatus === 'ending') {
        return { ...prev, transitionStatus: undefined };
      }

      return prev;
    });
  });

  createEffect(() => {
    if (!open() && state.mounted && state.transitionStatus !== 'ending' && deferEndingState) {
      const frame = AnimationFrame.request(() => {
        setState('transitionStatus', 'ending');
      });

      onCleanup(() => {
        AnimationFrame.cancel(frame);
      });
    }
  });

  createEffect(() => {
    if (!open() || enableIdleState) {
      return undefined;
    }

    const frame = AnimationFrame.request(() => {
      setState('transitionStatus', undefined);
    });

    onCleanup(() => {
      AnimationFrame.cancel(frame);
    });

    return undefined;
  });

  createRenderEffect(() => {
    if (!open() || !enableIdleState) {
      return undefined;
    }

    if (open() && state.mounted && state.transitionStatus !== 'idle') {
      setState('transitionStatus', 'starting');
    }

    const frame = AnimationFrame.request(() => {
      setState('transitionStatus', 'idle');
    });

    onCleanup(() => {
      AnimationFrame.cancel(frame);
    });

    return undefined;
  });

  return [state, setState] as const;
}
