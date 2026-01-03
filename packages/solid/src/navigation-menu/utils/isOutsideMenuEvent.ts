import { FloatingTreeType } from '../../floating-ui-solid';
import { contains, getNodeChildren } from '../../floating-ui-solid/utils';

interface Targets {
  currentTarget: HTMLElement | null | undefined;
  relatedTarget: HTMLElement | null | undefined;
}

interface Params {
  popupElement: HTMLElement | null | undefined;
  rootRef: HTMLDivElement | null | undefined;
  tree: FloatingTreeType | null;
  nodeId: string | undefined;
}

export function isOutsideMenuEvent({ currentTarget, relatedTarget }: Targets, params: Params) {
  const { popupElement, rootRef, tree, nodeId } = params;

  const nodeChildrenContains = tree
    ? getNodeChildren(tree.nodesRef, nodeId).some((node) =>
        contains(node.context?.elements.floating(), relatedTarget),
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
