import { createContext, useContext, type Accessor } from 'solid-js';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

export interface NavigationMenuItemContext {
  value: Accessor<string | undefined>;
  open: Accessor<boolean>;
  mounted: Accessor<boolean>;
  setMounted: (mounted: boolean) => void;
  transitionStatus: Accessor<TransitionStatus | undefined>;
  isActive: Accessor<boolean>;
}

export const NavigationMenuItemContext = createContext<NavigationMenuItemContext | undefined>();

export function useNavigationMenuItemContext() {
  const value = useContext(NavigationMenuItemContext);
  if (value === undefined) {
    throw new Error(
      'Base UI: NavigationMenuItem parts must be used within a <NavigationMenu.Item>.',
    );
  }
  return value;
}
