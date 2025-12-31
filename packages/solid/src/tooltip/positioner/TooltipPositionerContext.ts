import { createContext, useContext, type Accessor, type JSX, type Setter } from 'solid-js';
import type { Align, Side } from '../../utils/useAnchorPositioning';

export interface TooltipPositionerContext {
  open: Accessor<boolean>;
  side: Accessor<Side>;
  align: Accessor<Align>;
  arrowUncentered: Accessor<boolean>;
  arrowStyles: Accessor<JSX.CSSProperties>;
  anchorHidden: Accessor<boolean>;
  arrowRef: Accessor<Element | null | undefined>;
  setArrowRef: Setter<Element | null | undefined>;
}

export const TooltipPositionerContext = createContext<TooltipPositionerContext | undefined>(
  undefined,
);

export function useTooltipPositionerContext() {
  const context = useContext(TooltipPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TooltipPositionerContext is missing. TooltipPositioner parts must be placed within <Tooltip.Positioner>.',
    );
  }
  return context;
}
