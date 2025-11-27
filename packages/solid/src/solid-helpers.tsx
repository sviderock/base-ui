import {
  createMemo,
  createSignal,
  onMount,
  splitProps,
  type Accessor,
  type JSX,
  type SplitProps,
} from 'solid-js';

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

// https://github.com/solidjs-community/solid-primitives/blob/461ab9edda2ffa6666d7ed2d5deed8b6b77f65a6/packages/utils/src/types.ts#L29
export type MaybeAccessor<T> = T | Accessor<T>;

// https://github.com/solidjs-community/solid-primitives/blob/461ab9edda2ffa6666d7ed2d5deed8b6b77f65a6/packages/utils/src/types.ts#L42C1-L44C7
export type MaybeAccessorValue<T extends MaybeAccessor<any>> = T extends () => any
  ? ReturnType<T>
  : T;

export function autofocus(element: HTMLElement, autofocusProp: Accessor<boolean>) {
  if (autofocusProp?.() === false) {
    return;
  }

  onMount(() => {
    if (element.hasAttribute('autofocus')) {
      queueMicrotask(() => element.focus());
    }
  });
}

// https://github.com/solidjs-community/solid-primitives/blob/461ab9edda2ffa6666d7ed2d5deed8b6b77f65a6/packages/utils/src/index.ts#L106C1-L107C59
export function access<T>(v: MaybeAccessor<T>): T {
  return typeof v === 'function' && !v.length ? (v as Accessor<T>)() : (v as T);
}

export type Args<T extends ((...args: any[]) => any) | undefined | null> = Parameters<
  Exclude<T, undefined | null>
>;

export function splitComponentProps<
  T extends Record<any, any>,
  K extends [readonly (keyof T)[], ...(readonly (keyof T)[])[]],
>(props: T, ...keys: K) {
  const [componentProps, ...others] = splitProps(props, ['class', 'render', 'children'], ...keys);
  return [componentProps, ...others] as unknown as SplitProps<
    T,
    [componentPropsToOmit: ['class', 'render', 'children'], ...K]
  >;
}

export function createAccessors<
  const T extends Array<string | { key: string; initialValue: Accessor<string | undefined> }>,
  K extends T[number] extends infer U
    ? U extends string
      ? U
      : U extends { key: string }
        ? U['key']
        : never
    : never,
>(keys: T) {
  const accessors = {} as {
    [KK in K]: Accessor<string | undefined>;
  } & {
    [KK in K as `set${Capitalize<KK>}`]: (newAccessor: Accessor<string | undefined>) => void;
  };

  for (const keyItem of keys) {
    const [storedAccessor, setStoredAccessor] = createSignal<Accessor<string | undefined>>(
      typeof keyItem === 'object' && 'initialValue' in keyItem
        ? keyItem.initialValue
        : () => undefined,
    );
    const key = typeof keyItem === 'string' ? keyItem : keyItem.key;
    const capitalizedKey = `set${key.charAt(0).toUpperCase()}${key.slice(1)}` as Capitalize<K>;

    (accessors as any)[key] = createMemo(() => storedAccessor()());
    (accessors as any)[capitalizedKey] = (newAccessor: Accessor<string | undefined>) =>
      setStoredAccessor(() => newAccessor);
  }

  return accessors;
}
