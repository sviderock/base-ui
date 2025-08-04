import { type VirtualElement } from '@floating-ui/dom';
import { isElement } from '@floating-ui/utils/dom';
import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { useFloatingTree } from '../components/FloatingTree';
import type {
  FloatingContext,
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
  options: UseFloatingOptions = {},
): Accessor<UseFloatingReturn<RT>> {
  const internalRootContext = useFloatingRootContext({
    ...options,
    elements: {
      reference: () => undefined,
      floating: () => undefined,
      domReference: () => undefined,
      ...options.elements,
    },
  });

  const rootContext = createMemo(() => options.rootContext || internalRootContext);

  const computedElements = createMemo(() => rootContext().elements);

  const [domReferenceState, setDomReference] = createSignal<NarrowedElement<RT>>();
  const [positionReference, setPositionReferenceRaw] = createSignal<ReferenceType>();

  const optionDomReference = createMemo(() => computedElements().domReference());
  const domReference = createMemo(
    () => (optionDomReference() || domReferenceState()) as NarrowedElement<RT> | undefined,
  );

  const tree = useFloatingTree();

  const position = usePosition({
    ...options,
    elements: {
      floating: computedElements().floating,
      reference: positionReference as Accessor<NarrowedElement<RT> | undefined>,
    },
  });

  const setPositionReference = (node: ReferenceType | undefined) => {
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
    position().refs.setReference(computedPositionReference);
  };

  const setReference = (node: RT | undefined) => {
    if (isElement(node) || node === undefined) {
      setDomReference(() => node as NarrowedElement<RT> | undefined);
    }

    // Backwards-compatibility for passing a virtual element to `reference`
    // after it has set the DOM reference.
    const reference = position().refs.reference();
    if (
      isElement(reference) ||
      reference === undefined ||
      // Don't allow setting virtual elements using the old technique back to
      // `null` to support `positionReference` + an unstable `reference`
      // callback ref.
      (node !== undefined && !isElement(node))
    ) {
      position().refs.setReference(node);
    }
  };

  const refs = createMemo(() => ({
    ...position().refs,
    setReference,
    setPositionReference,
    domReference,
    setDomReference,
  }));

  const elements = createMemo(() => ({
    ...position().elements,
    domReference,
  }));

  const context = createMemo<FloatingContext<RT>>(() => ({
    ...position(),
    ...rootContext(),
    refs: refs(),
    elements: elements(),
    nodeId: () => rootContext().floatingId(),
  }));

  createEffect(() => {
    // TODO: fix typing
    const ctx = context() as unknown as FloatingContext;
    rootContext().dataRef.floatingContext = ctx;

    const node = tree?.nodesRef.find((n) => n.id() === rootContext().floatingId());
    if (node) {
      node.context = ctx;
    }
  });

  const returnValue = createMemo<UseFloatingReturn<RT>>(() => ({
    ...position(),
    context: context(),
    // @ts-expect-error – TODO: fix typing
    refs: refs(),
    elements: elements(),
  }));

  return returnValue;
}
