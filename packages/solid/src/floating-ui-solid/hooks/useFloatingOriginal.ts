import { computePosition } from '@floating-ui/dom';
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  type Accessor,
  type JSX,
  type Setter,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import type {
  ComputePositionConfig,
  ComputePositionReturn,
  Prettify,
  ReferenceType,
  UseFloatingOptions,
} from '../types';

export type UseFloatingReturn<RT extends ReferenceType = ReferenceType> = Prettify<
  ComputePositionReturn & { isPositioned: boolean } & {
    /**
     * Update the position of the floating element, re-rendering the component
     * if required.
     */
    update: () => void;
    /**
     * Pre-configured positioning styles to apply to the floating element.
     */
    floatingStyles: Accessor<JSX.CSSProperties>;
    /**
     * Object containing the reference and floating refs and reactive setters.
     */
    refs: Accessor<{
      reference: Accessor<RT | null>;
      floating: Accessor<HTMLElement | null>;
      setReference: Setter<RT | null>;
      setFloating: Setter<HTMLElement | null>;
    }>;
    elements: {
      reference: Accessor<ReferenceType | null>;
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
): UseFloatingReturn<RT> {
  const merged = mergeProps(
    {
      placement: 'bottom',
      strategy: 'absolute',
      middleware: [],
      elements: {} as UseFloatingOptions['elements'],
      transform: true,
    } satisfies UseFloatingOptions,
    options,
  );
  const [data, setData] = createStore<UsePositionData>({
    x: 0,
    y: 0,
    strategy: merged.strategy,
    placement: merged.placement,
    middlewareData: {},
    isPositioned: false,
  });

  const [reference, setReference] = createSignal<RT | null>(null);
  const [floating, setFloating] = createSignal<HTMLElement | null>(null);

  const referenceEl = () => (merged.elements?.reference || reference()) as RT | null;
  const floatingEl = () => merged.elements?.floating || floating();

  let isMountedRef = false;

  function update() {
    if (!reference() || !floating()) {
      return;
    }

    const config: ComputePositionConfig = {
      platform: merged.platform,
      placement: merged.placement,
      strategy: merged.strategy,
      middleware: merged.middleware,
    };

    computePosition(reference()!, floating()!, config).then((computedData) => {
      const fullData = {
        ...computedData,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: merged.open !== false,
      };
      if (isMountedRef && !deepEqual(data, fullData)) {
        setData(fullData);
      }
    });
  }

  createEffect(() => {
    if (merged.open === false && data.isPositioned) {
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
      if (merged.whileElementsMounted) {
        return merged.whileElementsMounted(referenceEl()!, floatingEl()!, update);
      }

      update();
    }
  });

  const refs = createMemo(() => ({ reference, floating, setReference, setFloating }));
  const elements = { reference: referenceEl, floating: floatingEl };

  const floatingStyles = createMemo((): JSX.CSSProperties => {
    const initialStyles: JSX.CSSProperties = {
      position: merged.strategy,
      left: 0,
      top: 0,
    };

    if (!elements.floating()) {
      return initialStyles;
    }

    const x = roundByDPR(elements.floating()!, data.x);
    const y = roundByDPR(elements.floating()!, data.y);

    if (merged.transform) {
      return {
        ...initialStyles,
        transform: `translate(${x}px, ${y}px)`,
        ...(getDPR(elements.floating()!) >= 1.5 && { willChange: 'transform' }),
      };
    }

    return {
      position: merged.strategy,
      left: `${x}px`,
      top: `${y}px`,
    };
  });

  return {
    ...data,
    update,
    refs,
    elements,
    floatingStyles,
  };
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

type UsePositionData = Prettify<ComputePositionReturn & { isPositioned: boolean }>;
