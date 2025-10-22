import { createContext, useContext, type Accessor } from 'solid-js';
import type { ToastObject } from '../useToastManager';

export interface ToastRootContext {
  toast: Accessor<ToastObject<any>>;
  refs: {
    rootRef: HTMLElement | null | undefined;
  };
  titleId: Accessor<string | undefined>;
  setTitleIdAccessor: (newTitleIdAccessor: Accessor<string | undefined>) => void;
  descriptionId: Accessor<string | undefined>;
  setDescriptionIdAccessor: (newDescriptionAccessor: Accessor<string | undefined>) => void;
  swipeDirection: Accessor<'up' | 'down' | 'left' | 'right' | undefined>;
  renderScreenReaderContent: Accessor<boolean>;
  swiping: Accessor<boolean>;
}

export const ToastRootContext = createContext<ToastRootContext | undefined>(undefined);

export function useToastRootContext(): ToastRootContext {
  const context = useContext(ToastRootContext);
  if (!context) {
    throw new Error(
      'Base UI: ToastRootContext is missing. Toast parts must be used within <Toast.Root>.',
    );
  }
  return context;
}
