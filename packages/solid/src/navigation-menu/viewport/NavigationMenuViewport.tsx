'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * The clipping viewport of the navigation menu's current content.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuViewport(componentProps: NavigationMenuViewport.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { setViewportElement } = useNavigationMenuRootContext();

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={(el) => {
        setViewportElement(el);
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{ props: elementProps }}
    />
  );
}

export namespace NavigationMenuViewport {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
