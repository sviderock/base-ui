'use client';
import { type Accessor, createEffect, createSignal } from 'solid-js';

let globalId = 0;

/**
 *
 * @example
 * const id = useId();
 * return <div id={id} />;
 *
 * @param idOverride
 * @returns {string}
 */
export function useId(idOverride?: string, prefix: string = 'mui'): Accessor<string | undefined> {
  const [defaultId, setDefaultId] = createSignal(idOverride);
  const id = () => idOverride || defaultId();
  createEffect(() => {
    if (defaultId() == null) {
      // Fallback to this default id when possible.
      // Use the incrementing value for client-side rendering only.
      // We can't use it server-side.
      // If you want to use random values please consider the Birthday Problem: https://en.wikipedia.org/wiki/Birthday_problem
      globalId += 1;
      setDefaultId(`${prefix}-${globalId}`);
    }
  });

  return id;
}
