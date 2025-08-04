import {
  children,
  createSignal,
  getOwner,
  type Accessor,
  type JSX,
  type ParentProps,
} from 'solid-js';
import { createStore, type SetStoreFunction, type Store } from 'solid-js/store';

export function callEventHandler<T, E extends Event>(
  eventHandler: JSX.EventHandlerUnion<T, E> | undefined,
  event: E & { currentTarget?: T; target?: Element },
) {
  if (eventHandler) {
    if (typeof eventHandler === 'function') {
      eventHandler(event);
    } else {
      eventHandler[0](eventHandler[1], event);
    }
  }

  return event.defaultPrevented;
}

export type Accessify<T, AccessorKeys extends keyof T> = {
  [K in keyof T]: K extends AccessorKeys ? Accessor<T[K]> : T[K];
};

export type MaybeAccessor<T> = T | Accessor<T>;

export function withResolvers<T>(): {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
} {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { resolve: resolve!, reject: reject!, promise: promise as Promise<T> };
}

/**
 * Simple implementation of a lazy and memoaized version of the
 * children() function.
 *
 */
export function childrenLazy<T extends Record<string, any>>(
  props: ParentProps<T>,
  onReady: ((v: any) => any) | null = null,
): any {
  let s = Symbol('LAZY_CHILDREN');
  let x: any = s;
  let o = getOwner();
  return function resolvedChildren() {
    if (x === s) {
      if (o === getOwner()) {
        console.warn('childrenLazy same owner');
      }

      x = children(() => props.children);
      onReady?.(x);
    }
    return x;
  };
}

export interface RefSignal<T extends Element> {
  ref: Accessor<T | undefined>;
  setRef: (value: T | undefined) => void;
}

export interface StoreSignal<T extends object> {
  store: Store<T>;
  setStore: SetStoreFunction<T>;
}

export function createRefSignal<T extends Element>(initialValue: T): RefSignal<T> {
  const [ref, setRef] = createSignal<T>(initialValue);
  return { ref, setRef };
}

export function createStoreSignal<T extends object>(initialValue: T): StoreSignal<T> {
  const [store, setStore] = createStore<T>(initialValue);
  return { store, setStore };
}
