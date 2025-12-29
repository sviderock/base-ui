'use client';
import { createContext, useContext, type Accessor, type Setter } from 'solid-js';
import type { FloatingRootContext } from '../../floating-ui-solid';
import { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';
import type { BaseUIHTMLProps, HTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

export type TooltipOpenChangeReason = BaseOpenChangeReason | 'disabled';

export interface TooltipRootContext {
  open: Accessor<boolean>;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: TooltipOpenChangeReason | undefined,
  ) => void;
  setTriggerElement: (el: Element | null | undefined) => void;
  positionerElement: Accessor<HTMLElement | null | undefined>;
  setPositionerElement: Setter<HTMLElement | null | undefined>;
  refs: {
    popupRef: HTMLElement | null | undefined;
  };
  delay: Accessor<number>;
  closeDelay: Accessor<number>;
  mounted: Accessor<boolean>;
  setMounted: (mounted: boolean) => void;
  triggerProps: (externalProps: HTMLProps | BaseUIHTMLProps) => BaseUIHTMLProps;
  popupProps: (externalProps: HTMLProps | BaseUIHTMLProps) => BaseUIHTMLProps;
  instantType: Accessor<'delay' | 'dismiss' | 'focus' | undefined>;
  floatingRootContext: FloatingRootContext;
  trackCursorAxis: Accessor<'none' | 'x' | 'y' | 'both'>;
  transitionStatus: Accessor<TransitionStatus>;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  hoverable: Accessor<boolean>;
}

export const TooltipRootContext = createContext<TooltipRootContext | undefined>(undefined);

export function useTooltipRootContext() {
  const context = useContext(TooltipRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TooltipRootContext is missing. Tooltip parts must be placed within <Tooltip.Root>.',
    );
  }

  return context;
}
