import { type Ref } from 'solid-js';
import { type ReactLikeRef } from '../solid-helpers';

type Result<I> = (val: I | null | undefined) => void;
type InputRef<I> = Ref<I | null | undefined> | ReactLikeRef<I>;

/**
 * Merges refs into a single memoized callback ref or `null`.
 */
export function useForkRef<I extends HTMLElement, J extends HTMLElement>(
  a: InputRef<I>,
  b: InputRef<J>,
): Result<I | J>;
export function useForkRef<I extends HTMLElement, J extends HTMLElement, K extends HTMLElement>(
  a: InputRef<I>,
  b: InputRef<J>,
  c: InputRef<K>,
): Result<I | J | K>;
export function useForkRef<
  I extends HTMLElement,
  J extends HTMLElement,
  K extends HTMLElement,
  L extends HTMLElement,
>(a: InputRef<I>, b: InputRef<J>, c: InputRef<K>, d: InputRef<L>): Result<I | J | K | L>;
export function useForkRef<
  I extends HTMLElement,
  J extends HTMLElement,
  K extends HTMLElement | undefined = undefined,
  L extends HTMLElement | undefined = undefined,
>(a: InputRef<I>, b: InputRef<J>, c?: InputRef<K>, d?: InputRef<L>): Result<I | J | K | L> {
  // @ts-expect-error - TODO: fix typing
  const forkRef = createForkRef([a, b, c, d]);
  return forkRef as Result<I | J | K | L>;
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
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < refs.length; i++) {
      if (typeof refs[i] === 'function') {
        (refs[i] as (val: I | null | undefined) => void)(instance);
        continue;
      }

      if (refs[i] != null && 'current' in (refs[i] as ReactLikeRef<I>)) {
        (refs[i] as ReactLikeRef<I>).current = instance;
        continue;
      }

      refs[i] = instance;
    }
  };
}
