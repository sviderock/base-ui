'use client';
import { createContext, useContext, type Accessor, type JSX, type Setter } from 'solid-js';
import type { FloatingContext } from '../../floating-ui-solid';
import type { Side } from '../../utils/useAnchorPositioning';

export interface MenuPositionerContext {
  /**
   * The side of the anchor element the popup is positioned relative to.
   */
  side: Accessor<Side>;
  /**
   * How to align the popup relative to the specified side.
   */
  align: Accessor<'start' | 'end' | 'center'>;
  refs: {
    arrowRef: Accessor<Element | null | undefined>;
    setArrowRef: Setter<Element | null | undefined>;
  };
  arrowUncentered: Accessor<boolean>;
  arrowStyles: Accessor<JSX.CSSProperties>;
  floatingContext: FloatingContext;
}

export const MenuPositionerContext = createContext<MenuPositionerContext>();

export function useMenuPositionerContext() {
  const context = useContext(MenuPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuPositionerContext is missing. MenuPositioner parts must be placed within <Menu.Positioner>.',
    );
  }
  return context;
}
