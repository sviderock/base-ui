import { createContext, useContext } from 'solid-js';
import type { HTMLProps } from '../../utils/types';
import type { useAnchorPositioning } from '../../utils/useAnchorPositioning';

export interface PopoverPositionerContext extends useAnchorPositioning.ReturnValue {
  props: HTMLProps;
}

export const PopoverPositionerContext = createContext<PopoverPositionerContext | undefined>(
  undefined,
);

export function usePopoverPositionerContext() {
  const context = useContext(PopoverPositionerContext);
  if (!context) {
    throw new Error(
      'Base UI: PopoverPositionerContext is missing. PopoverPositioner parts must be placed within <Popover.Positioner>.',
    );
  }
  return context;
}
