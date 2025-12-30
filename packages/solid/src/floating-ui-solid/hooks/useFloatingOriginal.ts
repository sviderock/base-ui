import { computePosition } from '@floating-ui/dom';
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  type Accessor,
  type JSX,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { access, type MaybeAccessor } from '../../solid-helpers';
import type {
  Accessorify,
  ComputePositionConfig,
  ComputePositionReturn,
  Prettify,
  ReferenceType,
  UseFloatingOptions,
} from '../types';

export type UsePositionData = ComputePositionReturn & { isPositioned: boolean };

export type UsePositionOptions<RT extends ReferenceType = ReferenceType> = Prettify<
  Partial<Accessorify<ComputePositionConfig, 'maybeAccessor'>> & {
    /**
     * A callback invoked when both the reference and floating elements are
     * mounted, and cleaned up when either is unmounted. This is useful for
     * setting up event listeners (e.g. pass `autoUpdate`).
     */
    whileElementsMounted?:
      | ((reference: RT, floating: HTMLElement, update: () => void) => () => void)
      | {
          fn: (reference: RT, floating: HTMLElement, update: () => void) => () => void;
          enabled: MaybeAccessor<boolean | undefined>;
        };
    /**
     * Object containing the reference and floating elements.
     */
    elements?: {
      reference?: MaybeAccessor<RT | null | undefined>;
      floating?: MaybeAccessor<HTMLElement | null | undefined>;
    };
    /**
     * The `open` state of the floating element to synchronize with the
     * `isPositioned` value.
     * @default false
     */
    open?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether to use `transform` for positioning instead of `top` and `left`
     * (layout) in the `floatingStyles` object.
     * @default true
     */
    transform?: MaybeAccessor<boolean | undefined>;
  }
>;

export interface UsePositionFloatingSharedReturn extends Accessorify<UsePositionData> {
  /**
   * Update the position of the floating element, re-rendering the component
   * if required.
   */
  update: () => void;
  /**
   * Pre-configured positioning styles to apply to the floating element.
   */
  floatingStyles: Accessor<JSX.CSSProperties>;
}

export type UsePositionFloatingReturn<RT extends ReferenceType = ReferenceType> = Prettify<
  UsePositionFloatingSharedReturn & {
    refs: {
      /**
       * A Solid ref to the reference element.
       */
      reference: Accessor<RT | null | undefined>;
      /**
       * A Solid ref to the floating element.
       */
      floating: Accessor<HTMLElement | null | undefined>;
      /**
       * A callback to set the reference element (reactive).
       */
      setReference: (value: RT | null | undefined) => void;
      /**
       * A callback to set the floating element (reactive).
       */
      setFloating: (value: HTMLElement | null | undefined) => void;
    };
    /**
     * Object containing the reference and floating elements.
     */
    elements: {
      reference: Accessor<RT | null | undefined>;
      floating: Accessor<HTMLElement | null | undefined>;
    };
  }
>;

/**
 * This is a Solid port of the React useFloating hook
 * https://github.com/floating-ui/floating-ui/blob/3286d01bc1425150ad5aaa22aee062fe70fa8f5c/packages/react-dom/src/useFloating.ts
 */
export function useFloatingOriginal<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions = {},
): UsePositionFloatingReturn<RT> {
  const open = createMemo(() => access(options.open));
  const placement = createMemo(() => access(options.placement) ?? 'bottom');
  const strategy = createMemo(() => access(options.strategy) ?? 'absolute');
  const middleware = createMemo(() => access(options.middleware) ?? []);
  const referenceProp = createMemo(() => access(options.elements?.reference));
  const floatingProp = createMemo(() => access(options.elements?.floating));
  const transform = createMemo(() => access(options.transform) ?? true);
  const whileElementsMountedFn = createMemo(() => {
    if (options.whileElementsMounted == null) {
      return null;
    }

    if (typeof options.whileElementsMounted === 'function') {
      return options.whileElementsMounted;
    }

    return access(options.whileElementsMounted.enabled) ? options.whileElementsMounted.fn : null;
  });

  const [data, setData] = createStore<UsePositionData>({
    x: 0,
    y: 0,
    // eslint-disable-next-line solid/reactivity
    strategy: access(strategy()),
    // eslint-disable-next-line solid/reactivity
    placement: access(placement()),
    middlewareData: {},
    isPositioned: false,
  });

  const [reference, setReference] = createSignal<RT | null | undefined>(null);
  const [floating, setFloating] = createSignal<HTMLElement | null | undefined>(null);

  const referenceEl = createMemo(() => (referenceProp() as RT | null | undefined) ?? reference());
  const floatingEl = createMemo(() => floatingProp() ?? floating());

  let isMountedRef = false;

  function update() {
    const r = referenceEl();
    const f = floatingEl();
    if (!r || !f) {
      return;
    }

    const config: ComputePositionConfig = {
      placement: placement(),
      strategy: strategy(),
      middleware: middleware(),
    };

    const platform = access(options.platform);
    if (platform) {
      config.platform = platform;
    }

    computePosition(r, f, config).then((computedData) => {
      if (isMountedRef) {
        setData(
          reconcile({
            ...computedData,
            // The floating element's position may be recomputed while it's closed
            // but still mounted (such as when transitioning out). To ensure
            // `isPositioned` will be `false` initially on the next open, avoid
            // setting it to `true` when `open === false` (must be specified).
            isPositioned: access(options.open) !== false,
          }),
        );
      }
    });
  }

  createEffect(() => {
    if (access(options.open) === false && data.isPositioned) {
      setData('isPositioned', false);
    }
  });

  onMount(() => {
    isMountedRef = true;

    onCleanup(() => {
      isMountedRef = false;
    });
  });

  createEffect(
    on([referenceEl, floatingEl, whileElementsMountedFn, open], () => {
      const r = referenceEl();
      const f = floatingEl();
      if (r && f) {
        const whileElementsMounted = whileElementsMountedFn();
        if (whileElementsMounted) {
          const cleanup = whileElementsMounted(r, f, update);
          onCleanup(cleanup);
          return;
        }

        update();
      }
    }),
  );

  const refs = {
    reference,
    floating,
    setReference,
    setFloating,
  };

  const elements = { reference: referenceEl, floating: floatingEl };

  const floatingStyles = createMemo<JSX.CSSProperties>(() => {
    const initialStyles: JSX.CSSProperties = {
      position: strategy(),
      left: 0,
      top: 0,
    };

    const el = elements.floating();
    if (!el) {
      return initialStyles;
    }

    const x = roundByDPR(el, data.x);
    const y = roundByDPR(el, data.y);

    if (transform()) {
      return {
        ...initialStyles,
        transform: `translate(${x}px, ${y}px)`,
        ...(getDPR(el) >= 1.5 && { willChange: 'transform' }),
      };
    }

    return {
      position: strategy(),
      left: `${x}px`,
      top: `${y}px`,
    };
  });

  return {
    update,
    refs,
    elements,
    floatingStyles,
    isPositioned: () => data.isPositioned,
    placement: () => data.placement,
    strategy: () => data.strategy,
    middlewareData: () => data.middlewareData,
    x: () => data.x,
    y: () => data.y,
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
