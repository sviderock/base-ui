import { createContext, useContext, type Accessor, type Setter } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';

export interface ScrollAreaRootContext {
  cornerSize: Store<{ width: number; height: number }>;
  setCornerSize: SetStoreFunction<{ width: number; height: number }>;
  thumbSize: Store<{ width: number; height: number }>;
  setThumbSize: SetStoreFunction<{ width: number; height: number }>;
  touchModality: Accessor<boolean>;
  hovering: Accessor<boolean>;
  setHovering: Setter<boolean>;
  scrollingX: Accessor<boolean>;
  setScrollingX: Setter<boolean>;
  scrollingY: Accessor<boolean>;
  setScrollingY: Setter<boolean>;
  viewportRef: Accessor<HTMLDivElement | null>;
  setViewportRef: (ref: HTMLDivElement | null) => void;
  scrollbarYRef: Accessor<HTMLDivElement | null>;
  setScrollbarYRef: (ref: HTMLDivElement | null) => void;
  scrollbarXRef: Accessor<HTMLDivElement | null>;
  setScrollbarXRef: (ref: HTMLDivElement | null) => void;
  thumbYRef: Accessor<HTMLDivElement | null>;
  setThumbYRef: (ref: HTMLDivElement | null) => void;
  thumbXRef: Accessor<HTMLDivElement | null>;
  setThumbXRef: (ref: HTMLDivElement | null) => void;
  cornerRef: Accessor<HTMLDivElement | null>;
  setCornerRef: (ref: HTMLDivElement | null) => void;
  handlePointerDown: (event: PointerEvent) => void;
  handlePointerMove: (event: PointerEvent) => void;
  handlePointerUp: (event: PointerEvent) => void;
  handleScroll: (scrollPosition: { x: number; y: number }) => void;
  rootId: Accessor<string | undefined>;
  hiddenState: Store<{
    scrollbarYHidden: boolean;
    scrollbarXHidden: boolean;
    cornerHidden: boolean;
  }>;
  setHiddenState: SetStoreFunction<{
    scrollbarYHidden: boolean;
    scrollbarXHidden: boolean;
    cornerHidden: boolean;
  }>;
}

export const ScrollAreaRootContext = createContext<ScrollAreaRootContext>();

export function useScrollAreaRootContext() {
  const context = useContext(ScrollAreaRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ScrollAreaRootContext is missing. ScrollArea parts must be placed within <ScrollArea.Root>.',
    );
  }
  return context;
}
