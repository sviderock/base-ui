import { onCleanup, type Ref } from 'solid-js';

type Result<I> = (val: I) => void;

/**
 * Merges refs into a single memoized callback ref or `null`.
 */
export function useForkRef<I>(a: Ref<I>, b: Ref<I>): Result<I>;
export function useForkRef<I>(a: Ref<I>, b: Ref<I>, c: Ref<I>): Result<I>;
export function useForkRef<I>(a: Ref<I>, b: Ref<I>, c: Ref<I>, d: Ref<I>): Result<I>;
export function useForkRef<I>(a: Ref<I>, b: Ref<I>, c?: Ref<I>, d?: Ref<I>): Result<I> {
  const forkRef = createForkRef([a, b, c, d]);
  return forkRef;
}

/**
 * Merges variadic amount of refs into a single memoized callback ref or `null`.
 */
export function useForkRefN<I>(...refs: Ref<I | undefined | null>[]): Result<I> {
  const forkRef = createForkRef(refs);
  return forkRef;
}

/**
 * https://github.com/solidjs-community/solid-primitives/blob/81a8348c31004910dc5beab4d5b2da9405584d14/packages/utils/src/index.ts#L71-L80
 * https://github.com/solidjs/solid/discussions/1558#discussioncomment-4982333
 */
export function createForkRef<I>(refs: (Ref<I> | undefined | null)[]) {
  return (instance: I) => {
    for (let i = 0; i < refs.length; i++) {
      if (typeof refs[i] === 'function') {
        (refs[i] as (val: I) => void)(instance);
      } else {
        refs[i] = instance;
      }
    }

    onCleanup(() => {
      for (let i = 0; i < refs.length; i++) {
        if (typeof refs[i] === 'function') {
          (refs[i] as (val: I | undefined) => void)(undefined);
        } else {
          refs[i] = undefined;
        }
      }
    });
  };
}
