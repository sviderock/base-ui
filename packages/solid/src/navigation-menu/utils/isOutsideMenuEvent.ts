import {
  FloatingTreeType,
  type FloatingNodeType,
  type ReferenceType,
} from '../../floating-ui-solid';
import { contains, getNodeChildren } from '../../floating-ui-solid/utils';
import { access } from '../../solid-helpers';

interface Targets {
  currentTarget: HTMLElement | null | undefined;
  relatedTarget: HTMLElement | null | undefined;
}

interface Params {
  popupElement: HTMLElement | null | undefined;
  rootRef: HTMLDivElement | null | undefined;
  tree: FloatingTreeType | null;
  virtualFloatingTree: Array<FloatingNodeType<ReferenceType>> | undefined;
  nodeId: string | undefined;
}

export function isOutsideMenuEvent({ currentTarget, relatedTarget }: Targets, params: Params) {
  const { popupElement, rootRef, tree, virtualFloatingTree, nodeId } = params;

  const nodeChildrenContains =
    tree || virtualFloatingTree
      ? getNodeChildren(tree?.nodesRef || virtualFloatingTree || [], nodeId).some((node) =>
          contains(access(node.context)?.elements.floating(), relatedTarget),
        )
      : [];

  return (
    !contains(popupElement, currentTarget) &&
    !contains(popupElement, relatedTarget) &&
    !contains(rootRef, relatedTarget) &&
    !nodeChildrenContains &&
    !(
      contains(popupElement, relatedTarget) &&
      relatedTarget?.hasAttribute('data-base-ui-focus-guard')
    )
  );
}
