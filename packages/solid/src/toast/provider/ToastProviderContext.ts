import { createContext, useContext, type Accessor, type Setter } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { ToastObject, useToastManager } from '../useToastManager';

export interface ToastContextValue<Data extends object> {
  toasts: Store<{ list: ToastObject<any>[] }>;
  setToasts: SetStoreFunction<{ list: ToastObject<any>[] }>;
  hovering: Accessor<boolean>;
  setHovering: Setter<boolean>;
  focused: Accessor<boolean>;
  setFocused: Setter<boolean>;
  add: (options: useToastManager.AddOptions<Data>) => string;
  update: (id: string, options: useToastManager.UpdateOptions<Data>) => void;
  promise: <Value>(
    value: Promise<Value>,
    options: useToastManager.PromiseOptions<Value, Data>,
  ) => Promise<Value>;
  close: (id: string) => void;
  pauseTimers: () => void;
  resumeTimers: () => void;
  remove: (id: string) => void;
  refs: {
    viewportRef: HTMLElement | null | undefined;
    windowFocusedRef: boolean;
  };
  prevFocusElement: Accessor<HTMLElement | null | undefined>;
  setPrevFocusElement: Setter<HTMLElement | null | undefined>;
  scheduleTimer: (id: string, delay: number, callback: () => void) => void;
  hasDifferingHeights: Accessor<boolean>;
}

export type ToastContext<Data extends object> = ToastContextValue<Data>;

export const ToastContext = createContext<ToastContext<any> | undefined>(undefined);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('Base UI: useToast must be used within <Toast.Provider>.');
  }
  return context;
}
