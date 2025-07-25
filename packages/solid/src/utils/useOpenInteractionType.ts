'use client';

import { createEffect, createSignal } from 'solid-js';
import { InteractionType, useEnhancedClickHandler } from './useEnhancedClickHandler';

/**
 * Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
 *
 * @param open The open state of the component.
 */
export function useOpenInteractionType(open: boolean) {
  const [openMethod, setOpenMethod] = createSignal<InteractionType | null>(null);

  createEffect(() => {
    if (!open && openMethod() !== null) {
      setOpenMethod(null);
    }
  });

  const handleTriggerClick = (_: MouseEvent, interactionType: InteractionType) => {
    if (!open) {
      setOpenMethod(interactionType);
    }
  };

  const { onClick, onPointerDown } = useEnhancedClickHandler(handleTriggerClick);

  return {
    openMethod,
    triggerProps: {
      onClick,
      onPointerDown,
    },
  };
}
