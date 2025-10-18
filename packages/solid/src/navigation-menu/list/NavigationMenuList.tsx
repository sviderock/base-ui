'use client';
import { type Accessor } from 'solid-js';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * Contains a list of navigation menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuList(componentProps: NavigationMenuList.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { orientation, open } = useNavigationMenuRootContext();

  const state: NavigationMenuList.State = { open };

  return (
    <CompositeRoot
      loop={false}
      orientation={orientation()}
      stopEventPropagation
      render={(p) => (
        <RenderElement
          element="div"
          componentProps={componentProps}
          ref={(el) => {
            p().ref(el);
            if (typeof componentProps.ref === 'function') {
              componentProps.ref(el);
            } else {
              componentProps.ref = el;
            }
          }}
          params={{ state, props: [p(), elementProps] }}
        />
      )}
    />
  );
}

export namespace NavigationMenuList {
  export interface State {
    /**
     * If `true`, the popup is open.
     */
    open: Accessor<boolean>;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
