import { createContext, useContext } from 'solid-js';

export interface ScrollAreaViewportContext {
  computeThumbPosition: () => void;
}

export const ScrollAreaViewportContext = createContext<ScrollAreaViewportContext>();

export function useScrollAreaViewportContext() {
  const context = useContext(ScrollAreaViewportContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ScrollAreaViewportContext missing. ScrollAreaViewport parts must be placed within <ScrollArea.Viewport>.',
    );
  }
  return context;
}
