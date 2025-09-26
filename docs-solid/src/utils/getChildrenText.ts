import type { JSX } from 'solid-js';

export function getChildrenText(children?: JSX.Element | HTMLCollection): string {
  const element = children as Element;

  if (element.children?.length > 0) {
    return getChildrenText(element.children);
  }

  if (Array.isArray(children)) {
    return children.map(getChildrenText).flat().filter(Boolean).join('');
  }

  if (typeof children === 'string') {
    return children;
  }

  return '';
}
