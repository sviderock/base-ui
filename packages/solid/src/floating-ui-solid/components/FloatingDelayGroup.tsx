import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js';
import { useTimeout, type Timeout } from '../../utils/useTimeout';

import { getDelay } from '../hooks/useHover';
import type { Delay, FloatingRootContext } from '../types';

interface ContextValue {
  hasProvider: Accessor<boolean>;
  setHasProvider: (value: boolean) => void;
  timeoutMs: Accessor<number>;
  setTimeoutMs: (value: number) => void;
  delayRef: Accessor<Delay>;
  setDelayRef: (value: Delay) => void;
  initialDelayRef: Delay;
  timeout: Timeout;
  currentIdRef: Accessor<any>;
  setCurrentIdRef: (value: any) => void;
  currentContextRef: {
    onOpenChange: (open: boolean) => void;
    setIsInstantPhase: (value: boolean) => void;
  } | null;
}

const FloatingDelayGroupContext = createContext<ContextValue>({
  hasProvider: () => false,
  setHasProvider: () => {},
  timeoutMs: () => 0,
  setTimeoutMs: () => {},
  delayRef: () => 0,
  setDelayRef: () => {},
  currentIdRef: () => null,
  setCurrentIdRef: () => {},
  initialDelayRef: 0,
  timeout: useTimeout(),
  currentContextRef: null,
});

export interface FloatingDelayGroupProps {
  children?: JSX.Element;
  /**
   * The delay to use for the group when it's not in the instant phase.
   */
  delay: Delay;
  /**
   * An optional explicit timeout to use for the group, which represents when
   * grouping logic will no longer be active after the close delay completes.
   * This is useful if you want grouping to “last” longer than the close delay,
   * for example if there is no close delay at all.
   */
  timeoutMs?: number;
}

/**
 * Experimental next version of `FloatingDelayGroup` to become the default
 * in the future. This component is not yet stable.
 * Provides context for a group of floating elements that should share a
 * `delay`. Unlike `FloatingDelayGroup`, `useDelayGroup` with this
 * component does not cause a re-render of unrelated consumers of the
 * context when the delay changes.
 * @see https://floating-ui.com/docs/FloatingDelayGroup
 * @internal
 */
export function FloatingDelayGroup(props: FloatingDelayGroupProps): JSX.Element {
  const initialDelayRef = props.delay;
  const [hasProvider, setHasProvider] = createSignal(false);
  const [timeoutMs, setTimeoutMs] = createSignal(props.timeoutMs ?? 0);
  const [delayRef, setDelayRef] = createSignal<Delay>(props.delay);
  const [currentIdRef, setCurrentIdRef] = createSignal<any>(null);
  const currentContextRef: ContextValue['currentContextRef'] = null;
  const timeout = useTimeout();

  return (
    <FloatingDelayGroupContext.Provider
      value={{
        hasProvider,
        setHasProvider,
        timeoutMs,
        setTimeoutMs,
        delayRef,
        setDelayRef,
        currentIdRef,
        setCurrentIdRef,
        initialDelayRef,
        timeout,
        currentContextRef,
      }}
    >
      {props.children}
    </FloatingDelayGroupContext.Provider>
  );
}

interface UseDelayGroupOptions {
  /**
   * Whether delay grouping should be enabled.
   * @default true
   */
  enabled?: Accessor<boolean>;
}

interface UseDelayGroupReturn {
  /**
   * The delay reference object.
   */
  delayRef: Accessor<Delay>;
  /**
   * Whether animations should be removed.
   */
  isInstantPhase: Accessor<boolean>;
  /**
   * Whether a `<FloatingDelayGroup>` provider is present.
   */
  hasProvider: Accessor<boolean>;
}

/**
 * Enables grouping when called inside a component that's a child of a
 * `FloatingDelayGroup`.
 * @see https://floating-ui.com/docs/FloatingDelayGroup
 * @internal
 */
export function useDelayGroup(
  context: FloatingRootContext,
  options: UseDelayGroupOptions = {},
): UseDelayGroupReturn {
  const enabled = () => options.enabled?.() ?? true;

  const groupContext = useContext(FloatingDelayGroupContext);

  const [isInstantPhase, setIsInstantPhase] = createSignal(false);

  createEffect(() => {
    function unset() {
      setIsInstantPhase(false);
      groupContext.currentContextRef?.setIsInstantPhase(false);
      groupContext.setCurrentIdRef(null);
      groupContext.currentContextRef = null;
      groupContext.setDelayRef(groupContext.initialDelayRef);
    }

    if (!enabled()) {
      return;
    }
    if (!groupContext.currentIdRef()) {
      return;
    }

    if (!context.open() && groupContext.currentIdRef() === context.floatingId()) {
      setIsInstantPhase(false);

      if (groupContext.timeoutMs()) {
        groupContext.timeout.start(groupContext.timeoutMs(), unset);

        onCleanup(() => {
          groupContext.timeout.clear();
        });
        return;
      }

      unset();
    }
  });

  createEffect(() => {
    if (!enabled()) {
      return;
    }
    if (!context.open()) {
      return;
    }

    const prevContext = groupContext.currentContextRef;
    const prevId = groupContext.currentIdRef();

    groupContext.currentContextRef = { onOpenChange: context.onOpenChange, setIsInstantPhase };
    groupContext.setCurrentIdRef(context.floatingId());
    groupContext.setDelayRef({
      open: 0,
      close: getDelay(() => groupContext.initialDelayRef, 'close'),
    });

    if (prevId !== null && prevId !== context.floatingId()) {
      groupContext.timeout.clear();
      setIsInstantPhase(true);
      prevContext?.setIsInstantPhase(true);
      prevContext?.onOpenChange(false);
    } else {
      setIsInstantPhase(false);
      prevContext?.setIsInstantPhase(false);
    }
  });

  createEffect(() => {
    onCleanup(() => {
      groupContext.currentContextRef = null;
    });
  });

  return {
    hasProvider: groupContext.hasProvider,
    delayRef: groupContext.delayRef,
    isInstantPhase,
  };
}
