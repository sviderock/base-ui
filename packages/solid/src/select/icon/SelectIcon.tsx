'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An icon that indicates that the trigger button opens a select menu.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectIcon(componentProps: SelectIcon.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const element = useRenderElement('span', componentProps, {
    props: [{ 'aria-hidden': true }, elementProps],
    children: () => componentProps.children ?? '▼',
  });

  return <>{element()}</>;
}

export namespace SelectIcon {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
