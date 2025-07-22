import { type Accessor, createContext, useContext } from 'solid-js';

export interface ScrollAreaScrollbarContext {
  orientation: Accessor<'horizontal' | 'vertical'>;
}

export const ScrollAreaScrollbarContext = createContext<ScrollAreaScrollbarContext>();

export function useScrollAreaScrollbarContext() {
  const context = useContext(ScrollAreaScrollbarContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ScrollAreaScrollbarContext is missing. ScrollAreaScrollbar parts must be placed within <ScrollArea.Scrollbar>.',
    );
  }
  return context;
}
