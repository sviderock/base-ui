'use client';

import { createRenderEffect } from 'solid-js';

type Callback = (...args: any[]) => any;

type Stable<T extends Callback> = {
  /** The next value for callback */
  next: T | undefined;
  /** The function to be called by trampoline. This must fail during the initial render phase. */
  callback: T | undefined;
  trampoline: T;
  effect: () => void;
};

export function useEventCallback<T extends Callback>(callback: T | undefined): T {
  const stable = createStableCallback();
  stable.next = callback;
  // TODO: need an equivalent in solid
  createRenderEffect(() => {
    stable.effect();
  });
  return stable.trampoline;
}

function createStableCallback() {
  const stable: Stable<any> = {
    next: undefined,
    callback: assertNotCalled,
    trampoline: (...args: []) => {
      return stable.callback?.(...args);
    },
    effect: () => {
      // TODO: need to add onCleanup here
      stable.callback = stable.next;
    },
  };
  return stable;
}

function assertNotCalled() {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Base UI: Cannot call an event handler while rendering.');
  }
}
