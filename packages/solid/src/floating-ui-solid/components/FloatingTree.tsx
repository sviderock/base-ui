import { createContext, createEffect, useContext, type Accessor } from 'solid-js';
import { useId } from '../../utils/useId';
import type { FloatingNodeType, FloatingTreeType, ReferenceType } from '../types';
import { createEventEmitter } from '../utils/createEventEmitter';

const FloatingNodeContext = createContext<FloatingNodeType | null>(null);
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
  const reactParentId = useFloatingParentNodeId();
  const parentId = customParentId || reactParentId;

  createEffect(() => {
    if (!id) {
      return undefined;
    }
    const node = { id, parentId };
    tree?.addNode(node);
    return () => {
      tree?.removeNode(node);
    };
  });

  return id;
}

export interface FloatingNodeProps {
  children?: React.ReactNode;
  id: string | undefined;
}

/**
 * Provides parent node context for nested floating elements.
 * @see https://floating-ui.com/docs/FloatingTree
 * @internal
 */
export function FloatingNode(props: FloatingNodeProps): React.JSX.Element {
  const { children, id } = props;

  const parentId = useFloatingParentNodeId();

  return (
    <FloatingNodeContext.Provider value={React.useMemo(() => ({ id, parentId }), [id, parentId])}>
      {children}
    </FloatingNodeContext.Provider>
  );
}

export interface FloatingTreeProps {
  children?: React.ReactNode;
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
export function FloatingTree(props: FloatingTreeProps): React.JSX.Element {
  const { children } = props;

  const nodesRef = React.useRef<Array<FloatingNodeType>>([]);

  const addNode = React.useCallback((node: FloatingNodeType) => {
    nodesRef.current = [...nodesRef.current, node];
  }, []);

  const removeNode = React.useCallback((node: FloatingNodeType) => {
    nodesRef.current = nodesRef.current.filter((n) => n !== node);
  }, []);

  const [events] = React.useState(() => createEventEmitter());

  return (
    <FloatingTreeContext.Provider
      value={React.useMemo(
        () => ({
          nodesRef,
          addNode,
          removeNode,
          events,
        }),
        [addNode, removeNode, events],
      )}
    >
      {children}
    </FloatingTreeContext.Provider>
  );
}
