import { type VirtualElement } from '@floating-ui/dom';
import { isElement } from '@floating-ui/utils/dom';
import { createEffect, createMemo, createSignal, mergeProps as solidMergeProps } from 'solid-js';
import { access } from '../../solid-helpers';
import { useFloatingTree } from '../components/FloatingTree';
import type {
  NarrowedElement,
  ReferenceType,
  UseFloatingOptions,
  UseFloatingReturn,
} from '../types';
import { useFloatingOriginal as usePosition } from './useFloatingOriginal';
import { useFloatingRootContext } from './useFloatingRootContext';

/**
 * Provides data to position a floating element and context to add interactions.
 * @see https://floating-ui.com/docs/useFloating
 */

export function useFloating<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions<RT>,
): UseFloatingReturn<RT> {
  const defaultRootContext = useFloatingRootContext({
    ...options,
    elements: {
      reference: () => null,
      floating: () => null,
      ...options.elements,
    },
  });

  const rootContext = () => access(options.rootContext) || defaultRootContext;

  const [domReferenceState, setDomReference] = createSignal<NarrowedElement<RT> | null | undefined>(
    null,
  );
  const [positionReference, setPositionReferenceRaw] = createSignal<
    ReferenceType | null | undefined
  >(null);

  const optionDomReference = () => rootContext().elements.domReference();
  const domReference = createMemo(
    () => (optionDomReference() || domReferenceState()) as NarrowedElement<RT> | null | undefined,
  );

  const tree = useFloatingTree();

  const position = usePosition({
    ...(options as unknown as UseFloatingOptions<ReferenceType>),
    elements: {
      floating: () => rootContext().elements.floating(),
      reference: () =>
        (positionReference() ?? rootContext().elements.reference()) as
          | NarrowedElement<RT>
          | null
          | undefined,
    },
  });

  const setPositionReference = (node: ReferenceType | null | undefined) => {
    const computedPositionReference = isElement(node)
      ? ({
          getBoundingClientRect: () => node.getBoundingClientRect(),
          getClientRects: () => node.getClientRects(),
          contextElement: node,
        } satisfies VirtualElement)
      : node;
    // Store the positionReference in state if the DOM reference is specified externally via the
    // `elements.reference` option. This ensures that it won't be overridden on future renders.
    setPositionReferenceRaw(computedPositionReference);
    position.refs.setReference(computedPositionReference as RT | null | undefined);
  };

  const setReference = (node: RT | null | undefined) => {
    if (isElement(node) || node == null) {
      setDomReference(() => node as NarrowedElement<RT> | null | undefined);
    }

    // Backwards-compatibility for passing a virtual element to `reference`
    // after it has set the DOM reference.
    const reference = position.refs.reference();
    if (
      isElement(reference) ||
      reference == null ||
      // Don't allow setting virtual elements using the old technique back to
      // `null` to support `positionReference` + an unstable `reference`
      // callback ref.
      (node != null && !isElement(node))
    ) {
      position.refs.setReference(node);
    }
  };

  const refs = solidMergeProps(position.refs, {
    setReference,
    setPositionReference,
    domReference,
  });

  const elements = solidMergeProps(position.elements, {
    domReference,
  });

  const context: UseFloatingReturn<RT>['context'] = {
    // from UsePositionFloatingReturn
    update: position.update,
    floatingStyles: position.floatingStyles,
    isPositioned: position.isPositioned,
    placement: position.placement,
    strategy: position.strategy,
    middlewareData: position.middlewareData,
    x: position.x,
    y: position.y,

    // from FloatingRootContext
    open: () => rootContext().open(),
    onOpenChange: (...args) => rootContext().onOpenChange(...args),
    get events() {
      return rootContext().events;
    },
    get dataRef() {
      return rootContext().dataRef;
    },
    floatingId: () => rootContext().floatingId(),

    // additional
    refs,
    elements,
    nodeId: () => access(options.nodeId),
  };

  createEffect(() => {
    rootContext().dataRef.floatingContext = context;

    if (!tree) {
      return;
    }

    const nodeId = access(options.nodeId);
    const nodeIdx = tree.nodesRef.findIndex((n) => n.id === nodeId);
    if (nodeIdx !== -1) {
      tree.nodesRef[nodeIdx].context = context as any;
    }
  });

  return {
    update: position.update,
    floatingStyles: position.floatingStyles,
    isPositioned: position.isPositioned,
    placement: position.placement,
    strategy: position.strategy,
    middlewareData: position.middlewareData,
    x: position.x,
    y: position.y,
    context,
    refs,
    elements,
  };
}
