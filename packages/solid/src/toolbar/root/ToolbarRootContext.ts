'use client';
import { createContext, useContext, type Accessor, type Setter } from 'solid-js';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import type { Orientation } from '../../utils/types';
import type { ToolbarRoot } from './ToolbarRoot';

export interface ToolbarRootContext {
  disabled: Accessor<boolean>;
  orientation: Accessor<Orientation>;
  setItemArray: Setter<Array<CompositeMetadata<ToolbarRoot.ItemMetadata> | null>>;
}

export const ToolbarRootContext = createContext<ToolbarRootContext | undefined>(undefined);

export function useToolbarRootContext(optional?: false): ToolbarRootContext;
export function useToolbarRootContext(optional: true): ToolbarRootContext | undefined;
export function useToolbarRootContext(optional?: boolean) {
  const context = useContext(ToolbarRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToolbarRootContext is missing. Toolbar parts must be placed within <Toolbar.Root>.',
    );
  }

  return context;
}
