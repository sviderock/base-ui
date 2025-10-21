import { createContext, useContext } from 'solid-js';
import type { Accessorify } from '../../floating-ui-solid';
import type { SwitchRoot } from './SwitchRoot';

export type SwitchRootContext = Accessorify<SwitchRoot.State>;

export const SwitchRootContext = createContext<SwitchRootContext>();

export function useSwitchRootContext() {
  const context = useContext(SwitchRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SwitchRootContext is missing. Switch parts must be placed within <Switch.Root>.',
    );
  }

  return context;
}
