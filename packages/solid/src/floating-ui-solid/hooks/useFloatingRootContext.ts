import { isElement } from '@floating-ui/utils/dom';
import { createSignal, type Accessor } from 'solid-js';
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
  open?: Accessor<boolean | undefined>;
  onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  elements: {
    reference: Accessor<Element | null>;
    floating: Accessor<HTMLElement | null>;
    domReference: Accessor<Element | null>;
  };
}

export function useFloatingRootContext(
  options: UseFloatingRootContextOptions,
): FloatingRootContext {
  const open = () => options.open?.() ?? false;
  const floatingId = useId();
  const events = createEventEmitter();
  const parentId = useFloatingParentNodeId();
  const nested = () => parentId != null;
  const dataRef: ContextData = {};

  if (process.env.NODE_ENV !== 'production') {
    const optionDomReference = options.elements.reference();
    if (optionDomReference && !isElement(optionDomReference)) {
      console.error(
        'Cannot pass a virtual element to the `elements.reference` option,',
        'as it must be a real DOM element. Use `refs.setPositionReference()`',
        'instead.',
      );
    }
  }

  const [positionReference, setPositionReference] = createSignal<ReferenceElement | null>(
    options.elements.reference(),
  );
  const [floating, setFloating] = createSignal(options.elements.floating());
  const [domReference, setDomReference] = createSignal(options.elements.domReference());

  const onOpenChange = (newOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
    dataRef.openEvent = newOpen ? event : undefined;
    events.emit('openchange', { open: newOpen, event, reason, nested: nested() });
    options.onOpenChange?.(newOpen, event, reason);
  };

  const refs = {
    setPositionReference,
    setFloating,
    setDomReference,
  };

  const elements = {
    reference: () => positionReference() || options.elements.reference(),
    floating: () => floating() || options.elements.floating(),
    domReference: () => domReference() || options.elements.domReference(),
  };

  return {
    dataRef,
    open,
    onOpenChange,
    elements,
    events,
    floatingId,
    refs,
  };
}
