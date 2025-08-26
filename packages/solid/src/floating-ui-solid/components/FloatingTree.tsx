import {
  createContext,
  createEffect,
  onCleanup,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { useId } from '../../utils/useId';
import type { FloatingNodeType, FloatingTreeType, ReferenceType } from '../types';
import { createEventEmitter } from '../utils/createEventEmitter';

interface ContextFloatingNodeType {
  id: Accessor<FloatingNodeType['id']>;
  parentId: Accessor<FloatingNodeType['parentId']>;
  context?: FloatingNodeType['context'];
}

const FloatingNodeContext = createContext<ContextFloatingNodeType | null>(null);
const FloatingTreeContext = createContext<FloatingTreeType | null>(null);

/**
 * Returns the parent node id for nested floating elements, if available.
 * Returns `null` for top-level floating elements.
 */
export const useFloatingParentNodeId = (): Accessor<string | null> => () =>
  useContext(FloatingNodeContext)?.id() || null;

/**
 * Returns the nearest floating tree context, if available.
 */
export const useFloatingTree = <
  RT extends ReferenceType = ReferenceType,
>(): FloatingTreeType<RT> | null => useContext(FloatingTreeContext) as FloatingTreeType<RT> | null;

/**
 * Registers a node into the `FloatingTree`, returning its id.
 * @see https://floating-ui.com/docs/FloatingTree
 */
export function useFloatingNodeId(customParentId?: string): Accessor<string | undefined> {
  const id = useId();
  const tree = useFloatingTree();
  const solidParentId = useFloatingParentNodeId();
  const parentId = () => customParentId || solidParentId();

  createEffect(() => {
    if (!id()) {
      return;
    }

    const node = { id: id(), parentId: parentId() };
    tree?.addNode(node);

    onCleanup(() => {
      tree?.removeNode(node);
    });
  });

  return id;
}

export interface FloatingNodeProps {
  children?: JSX.Element;
  id: string | undefined;
}

/**
 * Provides parent node context for nested floating elements.
 * @see https://floating-ui.com/docs/FloatingTree
 * @internal
 */
export function FloatingNode(props: FloatingNodeProps): JSX.Element {
  const parentId = useFloatingParentNodeId();
  const contextValue = { id: () => props.id, parentId };

  return (
    <FloatingNodeContext.Provider value={contextValue}>
      {props.children}
    </FloatingNodeContext.Provider>
  );
}

export interface FloatingTreeProps {
  children?: JSX.Element;
}

/**
 * Provides context for nested floating elements when they are not children of
 * each other on the DOM.
 * This is not necessary in all cases, except when there must be explicit communication between parent and child floating elements. It is necessary for:
 * - The `bubbles` option in the `useDismiss()` Hook
 * - Nested virtual list navigation
 * - Nested floating elements that each open on hover
 * - Custom communication between parent and child floating elements
 * @see https://floating-ui.com/docs/FloatingTree
 * @internal
 */
export function FloatingTree(props: FloatingTreeProps): JSX.Element {
  const [nodesRef, setNodesRef] = createStore<Array<FloatingNodeType>>([]);

  function addNode(node: FloatingNodeType) {
    setNodesRef(produce((nodes) => nodes.push(node)));
  }

  function removeNode(node: FloatingNodeType) {
    setNodesRef(produce((nodes) => nodes.splice(nodes.indexOf(node), 1)));
  }

  const events = createEventEmitter();

  return (
    <FloatingTreeContext.Provider
      value={{
        nodesRef,
        setNodesRef,
        addNode,
        removeNode,
        events,
      }}
    >
      {props.children}
    </FloatingTreeContext.Provider>
  );
}
