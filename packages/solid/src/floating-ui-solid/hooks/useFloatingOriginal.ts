import { computePosition } from '@floating-ui/dom';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Accessor,
  type JSX,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import type {
  Accessorify,
  ComputePositionConfig,
  ComputePositionReturn,
  Prettify,
  ReferenceType,
  UseFloatingOptions,
} from '../types';

type UsePositionData = ComputePositionReturn & { isPositioned: boolean };

export type UsePositionOptions<RT extends ReferenceType = ReferenceType> = Prettify<
  Partial<Accessorify<ComputePositionConfig>> & {
    /**
     * A callback invoked when both the reference and floating elements are
     * mounted, and cleaned up when either is unmounted. This is useful for
     * setting up event listeners (e.g. pass `autoUpdate`).
     */
    whileElementsMounted?: (reference: RT, floating: HTMLElement, update: () => void) => () => void;
    /**
     * Object containing the reference and floating elements.
     */
    elements?: {
      reference?: Accessor<RT | null>;
      floating?: Accessor<HTMLElement | null>;
    };
    /**
     * The `open` state of the floating element to synchronize with the
     * `isPositioned` value.
     * @default false
     */
    open?: Accessor<boolean | undefined>;
    /**
     * Whether to use `transform` for positioning instead of `top` and `left`
     * (layout) in the `floatingStyles` object.
     * @default true
     */
    transform?: Accessor<boolean | undefined>;
  }
>;

export type UsePositionFloatingReturn<RT extends ReferenceType = ReferenceType> = Prettify<
  UsePositionData & {
    /**
     * Update the position of the floating element, re-rendering the component
     * if required.
     */
    update: () => void;
    /**
     * Pre-configured positioning styles to apply to the floating element.
     */
    floatingStyles: JSX.CSSProperties;
    /**
     * Object containing the reference and floating refs and reactive setters.
     */
    refs: {
      /**
       * A Solid ref to the reference element.
       */
      reference: Accessor<RT | null>;
      /**
       * A Solid ref to the floating element.
       */
      floating: Accessor<HTMLElement | null>;
      /**
       * A callback to set the reference element (reactive).
       */
      setReference: (value: RT | null) => void;
      /**
       * A callback to set the floating element (reactive).
       */
      setFloating: (value: HTMLElement | null) => void;
    };
    /**
     * Object containing the reference and floating elements.
     */
    elements: {
      reference: Accessor<RT | null>;
      floating: Accessor<HTMLElement | null>;
    };
  }
>;

/**
 * This is a Solid port of the React useFloating hook
 * https://github.com/floating-ui/floating-ui/blob/3286d01bc1425150ad5aaa22aee062fe70fa8f5c/packages/react-dom/src/useFloating.ts
 */
export function useFloatingOriginal<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions = {},
): Accessor<UsePositionFloatingReturn<RT>> {
  const placement = () => options.placement?.() ?? 'bottom';
  const strategy = () => options.strategy?.() ?? 'absolute';
  const middleware = () => options.middleware?.() ?? [];
  const elementsProp = () => options.elements ?? {};
  const transform = () => options.transform?.() ?? true;

  const [data, setData] = createStore<UsePositionData>({
    x: 0,
    y: 0,
    strategy: strategy(),
    placement: placement(),
    middlewareData: {},
    isPositioned: false,
  });

  const [reference, setReference] = createSignal<RT | null>(null);
  const [floating, setFloating] = createSignal<HTMLElement | null>(null);

  const referenceEl = createMemo(() => {
    return elementsProp().reference?.() || reference();
  });
  const floatingEl = createMemo(() => {
    return elementsProp().floating?.() || floating();
  });

  let isMountedRef = false;

  function update() {
    if (!reference() || !floating()) {
      return;
    }

    const config: ComputePositionConfig = {
      placement: placement(),
      strategy: strategy(),
      middleware: middleware(),
    };

    if (options.platform?.()) {
      config.platform = options.platform();
    }

    computePosition(reference()!, floating()!, config).then((computedData) => {
      const fullData = {
        ...computedData,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: options.open?.() !== false,
      };
      if (isMountedRef && !deepEqual(data, fullData)) {
        setData(fullData);
      }
    });
  }

  createEffect(() => {
    if (options.open?.() === false && data.isPositioned) {
      setData('isPositioned', false);
    }
  });

  onMount(() => {
    isMountedRef = true;
  });
  onCleanup(() => {
    isMountedRef = false;
  });

  createEffect(() => {
    if (referenceEl() && floatingEl()) {
      if (options.whileElementsMounted) {
        return options.whileElementsMounted(referenceEl()!, floatingEl()!, update);
      }

      update();
    }
    return undefined;
  });

  const refs = {
    reference,
    floating,
    setReference: (node: RT | null) => {
      setReference(() => node);
      // onCleanup(() => {
      //   setReference(null);
      // });
    },
    setFloating: (node: HTMLElement | null) => {
      setFloating(() => node);
      // TODO: This somehow fixes "useClientPoint > cleans up window listener when closing or disabling" test
      // onCleanup(() => {
      //   setFloating(null);
      // });
    },
  };
  const elements = { reference: referenceEl, floating: floatingEl };

  const floatingStyles = createMemo<JSX.CSSProperties>(() => {
    const initialStyles: JSX.CSSProperties = {
      position: strategy(),
      left: 0,
      top: 0,
    };

    if (!elements.floating()) {
      return initialStyles;
    }

    const x = roundByDPR(elements.floating()!, data.x);
    const y = roundByDPR(elements.floating()!, data.y);

    if (transform()) {
      return {
        ...initialStyles,
        transform: `translate(${x}px, ${y}px)`,
        ...(getDPR(elements.floating()!) >= 1.5 && { willChange: 'transform' }),
      };
    }

    return {
      position: strategy(),
      left: `${x}px`,
      top: `${y}px`,
    };
  });

  const returnValue = createMemo<UsePositionFloatingReturn<RT>>(() => ({
    ...data,
    update,
    refs,
    elements: elements as any,
    floatingStyles: floatingStyles(),
  }));

  return returnValue;
}

/**
 * This is a Solid port of the React roundByDPR function
 * https://github.com/floating-ui/floating-ui/blob/3286d01bc1425150ad5aaa22aee062fe70fa8f5c/packages/react-dom/src/utils/roundByDPR.ts
 */
function roundByDPR(element: Element, value: number) {
  const dpr = getDPR(element);
  return Math.round(value * dpr) / dpr;
}

/**
 * This is a Solid port of the React getDPR function
 * https://github.com/floating-ui/floating-ui/blob/3286d01bc1425150ad5aaa22aee062fe70fa8f5c/packages/react-dom/src/utils/getDPR.ts
 */
function getDPR(element: Element): number {
  if (typeof window === 'undefined') {
    return 1;
  }
  const win = element.ownerDocument.defaultView || window;
  return win.devicePixelRatio || 1;
}

/**
 * This is a Solid port of the React deepEqual function
 * https://github.com/floating-ui/floating-ui/blob/3286d01bc1425150ad5aaa22aee062fe70fa8f5c/packages/react-dom/src/utils/deepEqual.ts
 */
function deepEqual(a: any, b: any) {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a === 'function' && a.toString() === b.toString()) {
    return true;
  }

  let length: number;
  let i: number;
  let keys: Array<string>;

  if (a && b && typeof a === 'object') {
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0; ) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }

      return true;
    }

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) {
      return false;
    }

    for (i = length; i-- !== 0; ) {
      if (!{}.hasOwnProperty.call(b, keys[i])) {
        return false;
      }
    }

    for (i = length; i-- !== 0; ) {
      const key = keys[i];
      if (key === '_owner' && a.$$typeof) {
        continue;
      }

      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  return a !== a && b !== b;
}
