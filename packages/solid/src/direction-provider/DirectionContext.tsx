import { type Accessor, createContext, useContext } from 'solid-js';

export type TextDirection = 'ltr' | 'rtl';

export type DirectionContext = {
  direction: Accessor<TextDirection>;
};

/**
 * @internal
 */
export const DirectionContext = createContext<DirectionContext>();

export function useDirection(optional = true) {
  const context = useContext(DirectionContext);
  if (context === undefined && !optional) {
    throw new Error('Base UI: DirectionContext is missing.');
  }

  return () => context?.direction() ?? 'ltr';
}
