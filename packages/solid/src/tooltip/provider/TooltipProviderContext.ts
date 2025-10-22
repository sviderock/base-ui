import { createContext, useContext, type Accessor } from 'solid-js';

export interface TooltipProviderContext {
  delay: Accessor<number | undefined>;
  closeDelay: Accessor<number | undefined>;
}

export const TooltipProviderContext = createContext<TooltipProviderContext | undefined>(undefined);

export function useTooltipProviderContext(): TooltipProviderContext | undefined {
  return useContext(TooltipProviderContext);
}
