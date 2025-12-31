import { createContext, useContext } from 'solid-js';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';

export const NavigationMenuPositionerContext =
  createContext<ReturnType<typeof useAnchorPositioning>>();

export function useNavigationMenuPositionerContext() {
  const context = useContext(NavigationMenuPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: NavigationMenuPositionerContext is missing. NavigationMenuPositioner parts must be placed within <NavigationMenu.Positioner>.',
    );
  }
  return context;
}
