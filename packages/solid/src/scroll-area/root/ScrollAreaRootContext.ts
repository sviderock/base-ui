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
  viewportRef: Accessor<HTMLDivElement | undefined>;
  setViewportRef: (ref: HTMLDivElement | undefined) => void;
  scrollbarYRef: Accessor<HTMLDivElement | undefined>;
  setScrollbarYRef: (ref: HTMLDivElement | undefined) => void;
  scrollbarXRef: Accessor<HTMLDivElement | undefined>;
  setScrollbarXRef: (ref: HTMLDivElement | undefined) => void;
  thumbYRef: Accessor<HTMLDivElement | undefined>;
  setThumbYRef: (ref: HTMLDivElement | undefined) => void;
  thumbXRef: Accessor<HTMLDivElement | undefined>;
  setThumbXRef: (ref: HTMLDivElement | undefined) => void;
  cornerRef: Accessor<HTMLDivElement | undefined>;
  setCornerRef: (ref: HTMLDivElement | undefined) => void;
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
