import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { CodependentRefs } from '../../solid-helpers';
import type { ProgressRoot, ProgressStatus } from './ProgressRoot';

export type ProgressRootContext = {
  /**
   * Formatted value of the component.
   */
  formattedValue: Accessor<string>;
  /**
   * The maximum value.
   */
  max: Accessor<number>;
  /**
   * The minimum value.
   */
  min: Accessor<number>;
  /**
   * Value of the component.
   */
  value: Accessor<number | null>;
  state: ProgressRoot.State;
  status: Accessor<ProgressStatus>;
  codependentRefs: Store<CodependentRefs<['label']>>;
  setCodependentRefs: SetStoreFunction<CodependentRefs<['label']>>;
};

/**
 * @internal
 */
export const ProgressRootContext = createContext<ProgressRootContext | undefined>(undefined);

export function useProgressRootContext() {
  const context = useContext(ProgressRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.',
    );
  }

  return context;
}
