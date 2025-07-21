import { type Ref } from 'solid-js';

type Result<I> = (val: I | null | undefined) => void;
type InputRef<I> = Ref<I | undefined | null>;

/**
 * Merges refs into a single memoized callback ref or `null`.
 */
export function useForkRef<I>(a: InputRef<I>, b: InputRef<I>): Result<I>;
export function useForkRef<I>(a: InputRef<I>, b: InputRef<I>, c: InputRef<I>): Result<I>;
export function useForkRef<I>(
  a: InputRef<I>,
  b: InputRef<I>,
  c: InputRef<I>,
  d: InputRef<I>,
): Result<I>;
export function useForkRef<I>(
  a: InputRef<I>,
  b: InputRef<I>,
  c?: InputRef<I>,
  d?: InputRef<I>,
): Result<I> {
  const forkRef = createForkRef([a, b, c, d]);
  return forkRef;
}

/**
 * Merges variadic amount of refs into a single memoized callback ref or `null`.
 */
export function useForkRefN<I>(refs: InputRef<I>[]): Result<I> {
  const forkRef = createForkRef(refs);
  return forkRef;
}

/**
 * https://github.com/solidjs-community/solid-primitives/blob/81a8348c31004910dc5beab4d5b2da9405584d14/packages/utils/src/index.ts#L71-L80
 */
export function createForkRef<I>(refs: InputRef<I>[]): Result<I> {
  return function forkRef(instance: I | null | undefined) {
    for (let i = 0; i < refs.length; i++) {
      if (typeof refs[i] === 'function') {
        (refs[i] as (val: I | null | undefined) => void)(instance);
      } else {
        refs[i] = instance;
      }
    }
  };
}
