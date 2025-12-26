/**
 * Based on the original implementation of combineProps from @solid-primitives/props:
 * https://github.com/solidjs-community/solid-primitives/blob/0cbdb59bb42f50de5e08000027789ae3d4c80280/packages/props/src/combineProps.ts
 */

/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-cond-assign */
/* eslint-disable curly */
/* eslint-disable guard-for-in */

import { $PROXY, mergeProps, type ComponentProps, type JSX, type Ref } from 'solid-js';
import type { BaseUIEvent, WithBaseUIEvent } from '../utils/types';

function trueFn() {
  return true;
}

export const propTraps: ProxyHandler<{
  get: (k: string | number | symbol) => any;
  has: (k: string | number | symbol) => boolean;
  keys: () => string[];
}> = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn,
    };
  },
  ownKeys(_) {
    return _.keys();
  },
};

const extractCSSregex = /((?:--)?(?:\w+-?)+)\s*:\s*([^;]*)/g;

/**
 * converts inline string styles to object form
 * @example
 * const styles = stringStyleToObject("margin: 24px; border: 1px solid #121212");
 * styles; // { margin: "24px", border: "1px solid #121212" }
 * */
export function stringStyleToObject(style: string): JSX.CSSProperties {
  const object: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = extractCSSregex.exec(style))) {
    object[match[1]!] = match[2]!;
  }
  return object;
}

/**
 * Combines two set of styles together. Accepts both string and object styles.\
 * @example
 * const styles = combineStyle("margin: 24px; border: 1px solid #121212", {
 *   margin: "2rem",
 *   padding: "16px"
 * });
 * styles; // { margin: "2rem", border: "1px solid #121212", padding: "16px" }
 */
export function combineStyle(a: string, b: string): string;
export function combineStyle(
  a: JSX.CSSProperties | undefined,
  b: JSX.CSSProperties | undefined,
): JSX.CSSProperties;
export function combineStyle(
  a: JSX.CSSProperties | string | undefined,
  b: JSX.CSSProperties | string | undefined,
): JSX.CSSProperties;
export function combineStyle(
  a: JSX.CSSProperties | string | undefined,
  b: JSX.CSSProperties | string | undefined,
): JSX.CSSProperties | string {
  if (typeof a === 'string') {
    if (typeof b === 'string') return `${a};${b}`;

    a = stringStyleToObject(a);
  } else if (typeof b === 'string') {
    b = stringStyleToObject(b);
  }

  return { ...a, ...b };
}

type ElementType = keyof JSX.IntrinsicElements;
type PropsOf<T extends ElementType> = WithBaseUIEvent<ComponentProps<T>>;
export type MergablePropsCallback<T extends ElementType> = (otherProps: PropsOf<T>) => PropsOf<T>;

type PropsInput<T extends ElementType> = PropsOf<T> | MergablePropsCallback<T> | undefined;

const reduce = <T, K extends keyof T>(
  sources: Iterable<T>,
  key: K,
  calc: (a: NonNullable<T[K]>, b: NonNullable<T[K]>) => T[K],
) => {
  let v: T[K] | undefined;
  for (const value of sources) {
    if (!v) v = value[key];
    else if (value[key]) v = calc(v, value[key]);
  }
  return v;
};

/**
 * A helper that reactively merges multiple props objects together while smartly combining some of Solid's JSX/DOM attributes.
 *
 * Event handlers and refs are chained, class, classNames and styles are combined.
 * For all other props, the last prop object overrides all previous ones. Similarly to {@link mergeProps}
 * @param sources - Multiple sets of props to combine together.
 * @example
 * ```tsx
 * const MyButton: Component<ButtonProps> = props => {
 *    const { buttonProps } = createButton();
 *    const combined = combineProps(props, buttonProps);
 *    return <button {...combined} />
 * }
 * // component consumer can provide button props
 * // they will be combined with those provided by createButton() primitive
 * <MyButton style={{ margin: "24px" }} />
 * ```
 */
// export function combineProps<E extends ElementType>(sources: PropsInput<E>[]): PropsOf<E>;
// export function combineProps<E extends ElementType>(...sources: PropsInput<E>[]): PropsOf<E>;
export function combineProps<
  E extends ElementType | undefined = undefined,
  Args extends Array<any> = PropsInput<E extends ElementType ? E : any>[],
  R = PropsOf<E extends ElementType ? E : any>,
>(...args: Args): R {
  const restArgs = Array.isArray(args[0]);
  const sources = (restArgs ? args[0] : args) as Args;
  // create a map of event listeners to be chained
  const chainMap = {
    listeners: {} as Record<string, ((...args: any[]) => void) | undefined>,
    styles: [] as JSX.HTMLAttributes<any>[],
    refs: [] as Array<Ref<any>>,
    classes: [] as JSX.HTMLAttributes<any>[],
    classList: [] as JSX.HTMLAttributes<any>[],
  };

  let merge = {} as Record<string, unknown>;
  for (let props of sources) {
    let propsOverride = false;
    if (typeof props === 'function') {
      propsOverride = true;
      props = props(merge);
      chainMap.listeners = {};
    }

    for (const key in props) {
      if (key === 'style') {
        chainMap.styles.push(props as any);
        continue;
      }

      if (key === 'ref') {
        if (typeof props[key] === 'function') {
          chainMap.refs.push(props[key]);
        }
        continue;
      }

      if (key === 'class' || key === 'className') {
        chainMap.classes.push(props as any);
        continue;
      }

      if (key === 'classList') {
        chainMap.classList.push(props as any);
        continue;
      }

      if (propsOverride) {
        break;
      }

      // event listeners
      if (key[0] === 'o' && key[1] === 'n' && key[2]) {
        const v = props[key];
        const name = key.toLowerCase();

        const callback: ((...args: any[]) => void) | undefined =
          typeof v === 'function'
            ? v
            : // jsx event handlers can be tuples of [callback, arg]
              Array.isArray(v)
              ? v.length === 1
                ? v[0]
                : v[0].bind(void 0, v[1])
              : void 0;

        if (callback) {
          chainMap.listeners[name] = mergeEventHandlers(chainMap.listeners[name], callback);
        }
      }
    }

    // eslint-disable-next-line solid/reactivity
    merge = propsOverride ? (props ?? {}) : mergeProps(merge, props);
  }

  return new Proxy(
    {
      get(key) {
        if (typeof key !== 'string') {
          return Reflect.get(merge, key);
        }

        // Combine style prop
        if (key === 'style') {
          return reduce(chainMap.styles, 'style', combineStyle);
        }

        // chain props.ref assignments
        if (key === 'ref') {
          return reverseChain(chainMap.refs);
        }

        // Chain event listeners
        if (key[0] === 'o' && key[1] === 'n' && key[2]) {
          const name = key.toLowerCase();
          return chainMap.listeners[name] ?? Reflect.get(merge, key);
        }

        // Merge classes or classNames
        if (key === 'class') {
          return reduce(chainMap.classes, 'class', (a, b) => `${a} ${b}`);
        }

        // Merge classList objects, keys in the last object overrides all previous ones.
        if (key === 'classList') {
          return reduce(chainMap.classList, 'classList', (a, b) => ({ ...a, ...b }));
        }

        return Reflect.get(merge, key);
      },
      has(key) {
        return Reflect.has(merge, key);
      },
      keys() {
        return Object.keys(merge);
      },
    },
    propTraps,
  ) as any;
}

/**
 * https://github.com/solidjs-community/solid-primitives/blob/0cbdb59bb42f50de5e08000027789ae3d4c80280/packages/utils/src/index.ts#L82-L94
 * Returns a function that will call all functions in the reversed order with the same arguments.
 */
function reverseChain<Args extends [] | any[]>(
  callbacks: (((...args: Args) => any) | undefined)[],
): (...args: Args) => void {
  return (...args: Args) => {
    for (let i = callbacks.length - 1; i >= 0; i--) {
      const callback = callbacks[i];
      callback?.(...args);
    }
  };
}

function mergeEventHandlers(
  ourHandler: ((...args: any[]) => unknown) | undefined,
  theirHandler: ((...args: any[]) => unknown) | undefined,
): (...args: any[]) => void {
  if (!theirHandler) {
    return ourHandler as any;
  }
  if (!ourHandler) {
    return theirHandler as any;
  }

  return (event: unknown) => {
    if (event instanceof Event) {
      const baseUIEvent = event as BaseUIEvent<typeof event>;

      makeEventPreventable(baseUIEvent);

      const result = theirHandler(baseUIEvent);

      if (!baseUIEvent.baseUIHandlerPrevented) {
        ourHandler?.(baseUIEvent);
      }

      return result;
    }

    const result = theirHandler(event);
    ourHandler?.(event);
    return result;
  };
}

function makeEventPreventable<T extends Event>(event: BaseUIEvent<T>) {
  event.preventBaseUIHandler = () => {
    (event.baseUIHandlerPrevented as boolean) = true;
  };

  return event;
}
