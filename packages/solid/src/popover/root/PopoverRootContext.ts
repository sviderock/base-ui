'use client';
import { createContext, useContext, type Accessor, type Setter } from 'solid-js';
import type { FloatingRootContext } from '../../floating-ui-solid';
import type { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';
import type { HTMLProps } from '../../utils/types';
import type { InteractionType } from '../../utils/useEnhancedClickHandler';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

export type PopoverOpenChangeReason = BaseOpenChangeReason | 'close-press';

export interface PopoverRootContext {
  open: Accessor<boolean>;
  openOnHover: Accessor<boolean>;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: PopoverOpenChangeReason | undefined,
  ) => void;
  triggerElement: Accessor<Element | null | undefined>;
  setTriggerElement: (el: Element | null | undefined) => void;
  positionerElement: Accessor<HTMLElement | null | undefined>;
  setPositionerElement: (el: HTMLElement | null | undefined) => void;
  refs: {
    popupRef: HTMLElement | null | undefined;
  };
  delay: Accessor<number>;
  closeDelay: Accessor<number>;
  instantType: Accessor<'dismiss' | 'click' | undefined>;
  mounted: Accessor<boolean>;
  setMounted: (mounted: boolean) => void;
  transitionStatus: Accessor<TransitionStatus>;
  titleId: Accessor<string | undefined>;
  setTitleId: Setter<string | undefined>;
  descriptionId: Accessor<string | undefined>;
  setDescriptionId: Setter<string | undefined>;
  floatingRootContext: FloatingRootContext;
  triggerProps: Accessor<HTMLProps>;
  popupProps: Accessor<HTMLProps>;
  openMethod: Accessor<InteractionType | null>;
  openReason: Accessor<PopoverOpenChangeReason | null>;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  modal: Accessor<boolean | 'trap-focus'>;
}

export const PopoverRootContext = createContext<PopoverRootContext | undefined>(undefined);

export function usePopoverRootContext(optional?: false): PopoverRootContext;
export function usePopoverRootContext(optional: true): PopoverRootContext | undefined;
export function usePopoverRootContext(optional?: boolean) {
  const context = useContext(PopoverRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: PopoverRootContext is missing. Popover parts must be placed within <Popover.Root>.',
    );
  }
  return context;
}
