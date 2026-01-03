import { isElement } from '@floating-ui/utils/dom';
import { createSignal } from 'solid-js';
import { access, type MaybeAccessor } from '../../solid-helpers';
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
  open?: MaybeAccessor<boolean | undefined>;
  onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  elements: {
    reference: MaybeAccessor<Element | null | undefined>;
    floating: MaybeAccessor<HTMLElement | null | undefined>;
  };
}

export function useFloatingRootContext(
  options: UseFloatingRootContextOptions,
): FloatingRootContext {
  const open = () => access(options.open) ?? false;
  const floatingId = useId();
  const events = createEventEmitter();
  const parentId = useFloatingParentNodeId();
  const nested = parentId != null;
  const dataRef: ContextData = {};

  if (process.env.NODE_ENV !== 'production') {
    const optionDomReference = access(options.elements.reference);
    if (optionDomReference && !isElement(optionDomReference)) {
      console.error(
        'Cannot pass a virtual element to the `elements.reference` option,',
        'as it must be a real DOM element. Use `refs.setPositionReference()`',
        'instead.',
      );
    }
  }

  const [positionReference, setPositionReference] = createSignal<
    ReferenceElement | null | undefined
  >(access(options.elements.reference));

  const onOpenChange = (newOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
    dataRef.openEvent = newOpen ? event : undefined;
    events.emit('openchange', { open: newOpen, event, reason, nested });
    options.onOpenChange?.(newOpen, event, reason);
  };

  const refs = {
    setPositionReference,
  };

  const elements = {
    reference: () => positionReference() || access(options.elements.reference),
    floating: () => access(options.elements.floating),
    domReference: () => access(options.elements.reference),
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
