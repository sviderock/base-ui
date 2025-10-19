'use client';
import { createContext, useContext, type Accessor, type Setter } from 'solid-js';
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
  setLabelId: Setter<string | undefined>;
  state: Accessor<ProgressRoot.State>;
  status: Accessor<ProgressStatus>;
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
