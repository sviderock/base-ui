'use client';
import { createEffect, createRenderEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { access, type MaybeAccessor } from '../solid-helpers';
import { AnimationFrame } from './useAnimationFrame';

export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined;

/**
 * Provides a status string for CSS animations.
 * @param open - an accessor to a boolean that determines if the element is open.
 * @param enableIdleState - a boolean that enables the `'idle'` state between `'starting'` and `'ending'`
 */
export function useTransitionStatus(
  open: MaybeAccessor<boolean>,
  enableIdleState: MaybeAccessor<boolean> = false,
  deferEndingState: MaybeAccessor<boolean> = false,
) {
  const openProp = () => access(open);
  const enableIdleStateProp = () => access(enableIdleState);
  const deferEndingStateProp = () => access(deferEndingState);

  const [state, setState] = createStore<{ mounted: boolean; transitionStatus: TransitionStatus }>({
    mounted: openProp(),
    transitionStatus: openProp() && enableIdleStateProp() ? 'idle' : undefined,
  });

  createEffect(() => {
    setState((prev) => {
      if (openProp() && !prev.mounted) {
        return { mounted: true, transitionStatus: 'starting' };
      }

      if (
        !openProp() &&
        prev.mounted &&
        prev.transitionStatus !== 'ending' &&
        !deferEndingStateProp()
      ) {
        return { ...prev, transitionStatus: 'ending' };
      }

      if (!openProp() && !prev.mounted && prev.transitionStatus === 'ending') {
        return { ...prev, transitionStatus: undefined };
      }

      return prev;
    });
  });

  createEffect(() => {
    if (
      !openProp() &&
      state.mounted &&
      state.transitionStatus !== 'ending' &&
      deferEndingStateProp()
    ) {
      const frame = AnimationFrame.request(() => {
        setState('transitionStatus', 'ending');
      });

      onCleanup(() => {
        AnimationFrame.cancel(frame);
      });
    }
  });

  createEffect(() => {
    if (!openProp() || enableIdleStateProp()) {
      return;
    }

    const frame = AnimationFrame.request(() => {
      setState('transitionStatus', undefined);
    });

    onCleanup(() => {
      AnimationFrame.cancel(frame);
    });
  });

  createRenderEffect(() => {
    if (!openProp() || !enableIdleStateProp()) {
      return;
    }

    if (openProp() && state.mounted && state.transitionStatus !== 'idle') {
      setState('transitionStatus', 'starting');
    }

    const frame = AnimationFrame.request(() => {
      setState('transitionStatus', 'idle');
    });

    onCleanup(() => {
      AnimationFrame.cancel(frame);
    });

    return;
  });

  return [state, setState] as const;
}
