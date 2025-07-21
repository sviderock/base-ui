'use client';
import {
  createContext,
  onCleanup,
  onMount,
  useContext,
  type Accessor,
  type ParentProps,
} from 'solid-js';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { CollapsibleRoot } from './CollapsibleRoot';
import type { useCollapsibleRoot } from './useCollapsibleRoot';

export interface CollapsibleRootContext extends useCollapsibleRoot.ReturnValue {
  onOpenChange: (open: boolean) => void;
  state: CollapsibleRoot.State;
  transitionStatus: Accessor<TransitionStatus>;
}

export const CollapsibleRootContext = createContext<CollapsibleRootContext>();

export function useCollapsibleRootContext() {
  const context = useContext(CollapsibleRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: CollapsibleRootContext is missing. Collapsible parts must be placed within <Collapsible.Root>.',
    );
  }

  return context;
}

export function CollapsibleRootContextProvider(
  props: ParentProps<{ value: CollapsibleRootContext }>,
) {
  onMount(() => {
    console.log('mounted ROOT CONTEXT');
  });

  onCleanup(() => {
    console.log('unmounted ROOT CONTEXT');
  });

  return (
    <CollapsibleRootContext.Provider value={props.value}>
      {props.children}
    </CollapsibleRootContext.Provider>
  );
}
