'use client';
import { batch, createEffect, createMemo, createSignal, onCleanup, type JSX } from 'solid-js';
import { createStore } from 'solid-js/store';
import { activeElement, contains } from '../../floating-ui-solid/utils';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { generateId } from '../../utils/generateId';
import { ownerDocument } from '../../utils/owner';
import { useTimeout, type Timeout } from '../../utils/useTimeout';
import { createToastManager } from '../createToastManager';
import { ToastObject, useToastManager } from '../useToastManager';
import { isFocusVisible } from '../utils/focusVisible';
import { resolvePromiseOptions } from '../utils/resolvePromiseOptions';
import { ToastContext } from './ToastProviderContext';

interface TimerInfo {
  timeout?: Timeout;
  start: number;
  delay: number;
  remaining: number;
  callback: () => void;
}

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastProvider(props: ToastProvider.Props) {
  const timeout = () => access(props.timeout) ?? 5000;
  const limit = () => access(props.limit) ?? 3;

  const [toasts, setToasts] = createStore<ToastContext<any>['toasts']>({ list: [] });
  const [hovering, setHovering] = createSignal(false);
  const [focused, setFocused] = createSignal(false);
  const [prevFocusElement, setPrevFocusElement] = createSignal<HTMLElement | null | undefined>(
    null,
  );

  createEffect(() => {
    if (toasts.list.length === 0) {
      if (hovering()) {
        setHovering(false);
      }

      if (focused()) {
        setFocused(false);
      }
    }
  });

  // It's not possible to stack a smaller height toast onto a larger height toast, but
  // the reverse is possible. For simplicity, we'll enforce the expanded state if the
  // toasts aren't all the same height.
  const hasDifferingHeights = createMemo(() => {
    const heights = toasts.list.map((t) => t.height).filter((h) => h !== 0);
    return heights.length > 0 && new Set(heights).size > 1;
  });

  const refs: ToastContext<any>['refs'] = {
    viewportRef: null,
    windowFocusedRef: true,
  };

  const timersRef = new Map<string, TimerInfo>();
  let isPausedRef = false;

  const handleFocusManagement = (toastId: string) => {
    const activeEl = activeElement(ownerDocument(refs.viewportRef));
    if (!refs.viewportRef || !contains(refs.viewportRef, activeEl) || !isFocusVisible(activeEl)) {
      return;
    }

    const currentIndex = toasts.list.findIndex((toast) => toast.id === toastId);
    let nextToast: ToastObject<any> | null = null;

    // Try to find the next toast that isn't animating out
    let index = currentIndex + 1;
    while (index < toasts.list.length) {
      if (toasts.list[index].transitionStatus !== 'ending') {
        nextToast = toasts.list[index];
        break;
      }
      index += 1;
    }

    // Go backwards if no next toast is found
    if (!nextToast) {
      index = currentIndex - 1;
      while (index >= 0) {
        if (toasts.list[index].transitionStatus !== 'ending') {
          nextToast = toasts.list[index];
          break;
        }
        index -= 1;
      }
    }

    if (nextToast) {
      nextToast.ref?.focus();
    } else {
      prevFocusElement()?.focus({ preventScroll: true });
    }
  };

  const pauseTimers = () => {
    if (isPausedRef) {
      return;
    }
    isPausedRef = true;
    timersRef.forEach((timer) => {
      if (timer.timeout) {
        timer.timeout.clear();
        const elapsed = Date.now() - timer.start;
        const remaining = timer.delay - elapsed;
        timer.remaining = remaining > 0 ? remaining : 0;
      }
    });
  };

  const resumeTimers = () => {
    if (!isPausedRef) {
      return;
    }
    isPausedRef = false;
    timersRef.forEach((timer, id) => {
      timer.remaining = timer.remaining > 0 ? timer.remaining : timer.delay;
      timer.timeout ??= useTimeout();
      timer.timeout.start(timer.remaining, () => {
        timersRef.delete(id);
        timer.callback();
      });
      timer.start = Date.now();
    });
  };

  const close = (toastId: string) => {
    batch(() => {
      setToasts('list', (prevToasts) => {
        const toastsWithEnding = prevToasts.map((toast) =>
          toast.id === toastId
            ? { ...toast, transitionStatus: 'ending' as const, height: 0 }
            : toast,
        );

        const activeToasts = toastsWithEnding.filter((t) => t.transitionStatus !== 'ending');

        return toastsWithEnding.map((toast) => {
          if (toast.transitionStatus === 'ending') {
            return toast;
          }
          const isActiveToastLimited = activeToasts.indexOf(toast) >= limit();
          return { ...toast, limited: isActiveToastLimited };
        });
      });

      const timer = timersRef.get(toastId);
      if (timer && timer.timeout) {
        timer.timeout.clear();
        timersRef.delete(toastId);
      }

      const toast = toasts.list.find((t) => t.id === toastId);
      toast?.onClose?.();

      handleFocusManagement(toastId);

      if (toasts.list.length === 1) {
        batch(() => {
          setHovering(false);
          setFocused(false);
        });
      }
    });
  };

  const remove = (toastId: string) => {
    let onRemoveCallback: (() => void) | undefined;
    setToasts('list', (prev) =>
      prev.filter((toast) => {
        if (toast.id === toastId) {
          onRemoveCallback = toast.onRemove;
        }
        return toast.id !== toastId;
      }),
    );
    onRemoveCallback?.();
  };

  const scheduleTimer = (id: string, delay: number, callback: () => void) => {
    const start = Date.now();

    const shouldStartActive = refs.windowFocusedRef && !hovering() && !focused();

    const currentTimeout = shouldStartActive ? useTimeout() : undefined;

    currentTimeout?.start(delay, () => {
      timersRef.delete(id);
      callback();
    });

    timersRef.set(id, {
      timeout: currentTimeout,
      start: shouldStartActive ? start : 0,
      delay,
      remaining: delay,
      callback,
    });
  };

  const add = <Data extends object>(toast: useToastManager.AddOptions<Data>): string => {
    const id = toast.id || generateId('toast');
    const toastToAdd: ToastObject<Data> = {
      ...toast,
      id,
      transitionStatus: 'starting',
    };
    batch(() => {
      setToasts('list', (prev) => {
        const updatedToasts = [toastToAdd, ...prev];
        const activeToasts = updatedToasts.filter((t) => t.transitionStatus !== 'ending');

        // Mark oldest toasts for removal when over limit
        if (activeToasts.length > limit()) {
          const excessCount = activeToasts.length - limit();
          const oldestActiveToasts = activeToasts.slice(-excessCount);

          const res = updatedToasts.map((t) =>
            oldestActiveToasts.some((old) => old.id === t.id)
              ? { ...t, limited: true }
              : { ...t, limited: false },
          );

          return res;
        }

        return updatedToasts.map((t) => ({ ...t, limited: false }));
      });

      const duration = toastToAdd.timeout ?? timeout();
      if (toastToAdd.type !== 'loading' && duration > 0) {
        scheduleTimer(id, duration, () => close(id));
      }

      if (hovering() || focused() || !refs.windowFocusedRef) {
        pauseTimers();
      }
    });
    return id;
  };

  const update = <Data extends object>(
    id: string,
    updates: useToastManager.UpdateOptions<Data>,
  ) => {
    setToasts('list', (item) => item.id === id, updates);
  };

  const promise = <Value, Data extends object>(
    promiseValue: Promise<Value>,
    options: useToastManager.PromiseOptions<Value, Data>,
  ): Promise<Value> => {
    // Create a loading toast (which does not auto-dismiss).
    const loadingOptions = resolvePromiseOptions(options.loading);
    const id = add({
      ...loadingOptions,
      type: 'loading',
    });

    const handledPromise = promiseValue
      .then((result: Value) => {
        batch(() => {
          update(id, {
            ...resolvePromiseOptions(options.success, result),
            type: 'success',
          });

          scheduleTimer(id, timeout(), () => close(id));

          if (hovering() || focused() || !refs.windowFocusedRef) {
            pauseTimers();
          }
        });
        return result;
      })
      .catch((error) => {
        batch(() => {
          update(id, {
            ...resolvePromiseOptions(options.error, error),
            type: 'error',
          });

          scheduleTimer(id, timeout(), () => close(id));

          if (hovering() || focused() || !refs.windowFocusedRef) {
            pauseTimers();
          }
        });
        return Promise.reject(error);
      });

    // Private API used exclusively by `Manager` to handoff the promise
    // back to the manager after it's handled here.
    if ({}.hasOwnProperty.call(options, 'setPromise')) {
      (options as any).setPromise(handledPromise);
    }

    return handledPromise;
  };

  createEffect(function subscribeToToastManager() {
    if (!props.toastManager) {
      return;
    }

    const unsubscribe = props.toastManager[' subscribe'](({ action, options }) => {
      const id = options.id;

      if (action === 'promise' && options.promise) {
        promise(options.promise, options);
      } else if (action === 'update' && id) {
        update(id, options);
      } else if (action === 'close' && id) {
        close(id);
      } else {
        add(options);
      }
    });

    onCleanup(unsubscribe);
  });

  const contextValue: ToastContext<any> = {
    toasts,
    setToasts,
    hovering,
    setHovering,
    focused,
    setFocused,
    add,
    close,
    remove,
    update,
    promise,
    pauseTimers,
    resumeTimers,
    prevFocusElement,
    setPrevFocusElement,
    scheduleTimer,
    hasDifferingHeights,
    refs,
  };

  return <ToastContext.Provider value={contextValue}>{props.children}</ToastContext.Provider>;
}

export namespace ToastProvider {
  export interface Props {
    children?: JSX.Element;
    /**
     * The default amount of time (in ms) before a toast is auto dismissed.
     * A value of `0` will prevent the toast from being dismissed automatically.
     * @default 5000
     */
    timeout?: MaybeAccessor<number | undefined>;
    /**
     * The maximum number of toasts that can be displayed at once.
     * When the limit is reached, the oldest toast will be removed to make room for the new one.
     * @default 3
     */
    limit?: MaybeAccessor<number | undefined>;
    /**
     * A global manager for toasts to use outside of a React component.
     */
    toastManager?: createToastManager.ToastManager;
  }
}
