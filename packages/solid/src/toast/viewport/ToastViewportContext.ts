import { createContext, useContext } from 'solid-js';

export interface ToastViewportContext {
  refs: {
    viewportRef: HTMLElement | null | undefined;
  };
}

export const ToastViewportContext = createContext<ToastViewportContext | undefined>(undefined);

export function useToastViewportContext() {
  const context = useContext(ToastViewportContext);
  if (!context) {
    throw new Error(
      'Base UI: ToastViewportContext is missing. Toast parts must be placed within <Toast.Viewport>.',
    );
  }
  return context;
}
