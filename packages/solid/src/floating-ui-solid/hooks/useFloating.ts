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
): UseFloatingReturn<RT> {
  const rootContext =
    options.rootContext ||
    useFloatingRootContext({
      ...options,
      elements: {
        reference: () => null,
        floating: () => null,
        domReference: () => null,
        ...options.elements,
      },
    });

  const [domReferenceState, setDomReference] = createSignal<NarrowedElement<RT> | null>(null);
  const [positionReference, setPositionReferenceRaw] = createSignal<ReferenceType | null>(null);

  const optionDomReference = rootContext.elements.domReference;
  const domReference = createMemo(
    () => (optionDomReference() || domReferenceState()) as NarrowedElement<RT> | null,
  );

  const tree = useFloatingTree();

  const position = usePosition({
    ...options,
    elements: {
      floating: rootContext.elements.floating,
      reference: positionReference as Accessor<NarrowedElement<RT> | null>,
    },
  });

  const setPositionReference = (node: ReferenceType | null) => {
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

  const setReference = (node: RT | null) => {
    if (isElement(node) || node === null) {
      setDomReference(() => node as NarrowedElement<RT> | null);
    }

    // Backwards-compatibility for passing a virtual element to `reference`
    // after it has set the DOM reference.
    const reference = position().refs.reference();
    if (
      isElement(reference) ||
      reference === null ||
      // Don't allow setting virtual elements using the old technique back to
      // `null` to support `positionReference` + an unstable `reference`
      // callback ref.
      (node !== null && !isElement(node))
    ) {
      position().refs.setReference(node);
    }

    onCleanup(() => {
      setReference(null);
    });
  };

  const refs = {
    ...position().refs,
    setReference,
    setPositionReference,
    domReference,
    setDomReference,
  };

  const elements = {
    ...position().elements,
    domReference,
  };

  const context: FloatingContext<RT> = {
    ...position(),
    ...rootContext,
    refs,
    elements,
    nodeId: () => options.nodeId?.(),
  };

  createEffect(() => {
    rootContext.dataRef.floatingContext = context as unknown as FloatingContext;

    if (!tree) {
      return;
    }

    const nodeIdx = tree?.nodesRef.findIndex((n) => n.id === options.nodeId?.());
    if (nodeIdx !== -1) {
      tree?.setNodesRef(nodeIdx, 'context', context as unknown as FloatingContext);
    }
  });

  return {
    ...position(),
    context,
    refs,
    elements,
  } as UseFloatingReturn<RT>;
}
