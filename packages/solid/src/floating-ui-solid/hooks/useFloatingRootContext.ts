import { isElement } from '@floating-ui/utils/dom';
import { createSignal, type Accessor } from 'solid-js';
import { useEventCallback } from '../../utils/useEventCallback';
import { useId } from '../../utils/useId';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import type {
  ContextData,
  FloatingRootContext,
  OpenChangeReason,
  ReferenceElement,
} from '../types';
import { createEventEmitter } from '../utils/createEventEmitter';

export interface UseFloatingRootContextOptions {
  open?: Accessor<boolean>;
  onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  elements: {
    reference: Accessor<Element | null>;
    floating: Accessor<HTMLElement | null>;
  };
}

export function useFloatingRootContext(
  options: UseFloatingRootContextOptions,
): FloatingRootContext {
  const { open = false, onOpenChange: onOpenChangeProp, elements: elementsProp } = options;

  const floatingId = useId();
  let dataRef: ContextData = {};
  const [events] = createSignal(createEventEmitter());
  const nested = useFloatingParentNodeId() != null;

  if (process.env.NODE_ENV !== 'production') {
    const optionDomReference = elementsProp.reference;
    if (optionDomReference && !isElement(optionDomReference)) {
      console.error(
        'Cannot pass a virtual element to the `elements.reference` option,',
        'as it must be a real DOM element. Use `refs.setPositionReference()`',
        'instead.',
      );
    }
  }

  const [positionReference, setPositionReference] = React.useState<ReferenceElement | null>(
    elementsProp.reference,
  );

  const onOpenChange = useEventCallback(
    (newOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      dataRef.current.openEvent = newOpen ? event : undefined;
      events.emit('openchange', { open: newOpen, event, reason, nested });
      onOpenChangeProp?.(newOpen, event, reason);
    },
  );

  const refs = React.useMemo(
    () => ({
      setPositionReference,
    }),
    [],
  );

  const elements = React.useMemo(
    () => ({
      reference: positionReference || elementsProp.reference || null,
      floating: elementsProp.floating || null,
      domReference: elementsProp.reference as Element | null,
    }),
    [positionReference, elementsProp.reference, elementsProp.floating],
  );

  return React.useMemo<FloatingRootContext>(
    () => ({
      dataRef,
      open,
      onOpenChange,
      elements,
      events,
      floatingId,
      refs,
    }),
    [open, onOpenChange, elements, events, floatingId, refs],
  );
}
