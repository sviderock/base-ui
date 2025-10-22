import { createContext, useContext } from 'solid-js';
import { type MaybeAccessor } from '../../solid-helpers';

export const TooltipPortalContext = createContext<MaybeAccessor<boolean | undefined>>();

export function useTooltipPortalContext() {
  const value = useContext(TooltipPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Tooltip.Portal> is missing.');
  }
  return value;
}
