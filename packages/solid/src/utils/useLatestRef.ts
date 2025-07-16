'use client';
import { createEffect } from 'solid-js';

export function useLatestRef<T>(value: T) {
  const latest = createLatestRef(value);

  createEffect(() => {
    latest.next = value;
  });

  // TODO: get back to this
  createEffect(latest.effect);

  return latest;
}

function createLatestRef<T>(value: T) {
  const latest = {
    current: value,
    next: value,
    effect: () => {
      latest.current = latest.next;
    },
  };
  return latest;
}
