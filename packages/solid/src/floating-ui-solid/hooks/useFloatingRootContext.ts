import { isElement } from '@floating-ui/utils/dom';
import { createEffect, createSignal, onCleanup } from 'solid-js';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { useId } from '../../utils/useId';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import type {
  ContextData,
  FloatingNodeType,
  FloatingRootContext,
  OpenChangeReason,
  ReferenceElement,
  ReferenceType,
} from '../types';
import { FOCUSABLE_ATTRIBUTE } from '../utils/constants';
import { createEventEmitter } from '../utils/createEventEmitter';

export interface UseFloatingRootContextOptions {
  open?: MaybeAccessor<boolean | undefined>;
  onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  elements: {
    reference: MaybeAccessor<Element | null | undefined>;
    floating: MaybeAccessor<HTMLElement | null | undefined>;
  };
}

const virtualFloatingTree: Array<FloatingNodeType<ReferenceType>> = [];

export function useFloatingRootContext(
  options: UseFloatingRootContextOptions,
): FloatingRootContext {
  const open = () => access(options.open) ?? false;
  const floatingId = useId();
  const events = createEventEmitter();
  const parentId = useFloatingParentNodeId();
  const nested = parentId != null;
  const dataRef: ContextData = { virtualFloatingTree };

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

  createEffect(() => {
    const id = floatingId();
    if (!id) {
      return;
    }

    const reference = elements.reference();
    if (!reference) {
      return;
    }

    const parentFloating = (reference as Element)?.closest?.(`[${FOCUSABLE_ATTRIBUTE}]`);
    const parentIdx = dataRef.virtualFloatingTree?.findIndex(
      (item) => access(item.context)?.elements.floating() === parentFloating,
    );

    dataRef.virtualFloatingTree.push({
      id,
      parentId: parentIdx !== -1 ? (dataRef.virtualFloatingTree[parentIdx].id ?? null) : null,
    });
  });

  onCleanup(() => {
    dataRef.virtualFloatingTree = dataRef.virtualFloatingTree.filter(
      (item) => item.id !== floatingId(),
    );
  });

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
