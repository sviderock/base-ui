'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';

/**
 * An icon that indicates that the trigger button opens a select menu.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectIcon(componentProps: SelectIcon.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  return (
    <RenderElement
      element="span"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{ props: [{ 'aria-hidden': true, children: '▼' }, elementProps] }}
    />
  );
}

export namespace SelectIcon {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
