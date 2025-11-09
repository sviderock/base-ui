import { type VirtualElement } from '@floating-ui/dom';
import { isElement } from '@floating-ui/utils/dom';
import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { useFloatingTree } from '../components/FloatingTree';
import type {
  FloatingContext,
  FloatingRootContext,
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
  options: UseFloatingOptions<RT> & { rootContext: Accessor<FloatingRootContext<RT>> },
): UseFloatingReturn<RT, Accessor<FloatingContext<RT>>>;
export function useFloating<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions<RT> & { rootContext: FloatingRootContext<RT> },
): UseFloatingReturn<RT, FloatingContext<RT>>;
export function useFloating<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions<RT> & { rootContext?: never },
): UseFloatingReturn<RT, FloatingContext<RT>>;
export function useFloating<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions<RT> & { rootContext?: MaybeAccessor<FloatingRootContext<RT>> },
) {
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
    ...(options as UseFloatingOptions<ReferenceType>),
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

  const refs = {
    ...position.refs,
    setReference,
    setPositionReference,
    domReference,
  };

  const elements = {
    ...position.elements,
    domReference,
  };

  const context = createMemo<FloatingContext<RT>>(() => ({
    // from UsePositionFloatingReturn
    update: position.update,
    floatingStyles: position.floatingStyles,
    storeData: position.storeData,

    // from FloatingRootContext
    open: rootContext().open,
    onOpenChange: rootContext().onOpenChange,
    events: rootContext().events,
    dataRef: rootContext().dataRef,
    floatingId: rootContext().floatingId,

    // additional
    refs,
    elements,
    nodeId: () => access(options.nodeId),
  }));

  createEffect(() => {
    rootContext().dataRef.floatingContext = context() as unknown as FloatingContext;

    if (!tree) {
      return;
    }

    const nodeId = access(options.nodeId);
    const nodeIdx = tree.nodesRef.findIndex((n) => n.id === nodeId);
    if (nodeIdx !== -1) {
      tree?.setNodesRef(nodeIdx, 'context', context() as unknown as FloatingContext);
    }
  });

  return {
    update: position.update,
    floatingStyles: position.floatingStyles,
    isPositioned: () => position.storeData.isPositioned,
    placement: () => position.storeData.placement,
    strategy: () => position.storeData.strategy,
    middlewareData: () => position.storeData.middlewareData,
    x: () => position.storeData.x,
    y: () => position.storeData.y,
    // eslint-disable-next-line solid/reactivity
    context: typeof options.rootContext === 'function' ? context : context(),
    refs,
    elements,
  };
}
