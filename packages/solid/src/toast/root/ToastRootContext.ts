import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { CodepenedentRefs } from '../../solid-helpers';
import type { ToastObject } from '../useToastManager';

export interface ToastRootContext {
  toast: Accessor<ToastObject<any>>;
  refs: {
    rootRef: HTMLElement | null | undefined;
  };
  titleId: Accessor<string | undefined>;
  descriptionId: Accessor<string | undefined>;
  swipeDirection: Accessor<'up' | 'down' | 'left' | 'right' | undefined>;
  renderScreenReaderContent: Accessor<boolean>;
  swiping: Accessor<boolean>;
  codependentRefs: Store<CodepenedentRefs<['title', 'description']>>;
  setCodependentRefs: SetStoreFunction<CodepenedentRefs<['title', 'description']>>;
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
