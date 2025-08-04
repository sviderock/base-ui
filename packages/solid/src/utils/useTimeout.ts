'use client';
import { createSignal, onCleanup } from 'solid-js';

type TimeoutId = number;
export type Timeout = ReturnType<typeof useTimeout>;

const EMPTY = 0 as TimeoutId;

/**
 * A `setTimeout` with automatic cleanup and guard.
 */
export function useTimeout() {
  const [currentId, setCurrentId] = createSignal<TimeoutId>(EMPTY);

  function start(delay: number, fn: Function) {
    clear();
    setCurrentId(
      setTimeout(() => {
        setCurrentId(EMPTY);
        fn();
      }, delay) as unknown as TimeoutId,
    );
  }

  function clear() {
    if (currentId() !== EMPTY) {
      clearTimeout(currentId() as TimeoutId);
      setCurrentId(EMPTY);
    }
  }

  function isStarted() {
    return currentId() !== EMPTY;
  }

  onCleanup(() => {
    clear();
  });

  return { start, clear, isStarted };
}
