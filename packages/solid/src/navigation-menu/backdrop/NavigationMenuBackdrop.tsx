'use client';
import { type Accessor } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

const customStyleHookMapping: CustomStyleHookMapping<NavigationMenuBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A backdrop for the navigation menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuBackdrop(componentProps: NavigationMenuBackdrop.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open, mounted, transitionStatus } = useNavigationMenuRootContext();

  const state: NavigationMenuBackdrop.State = {
    open,
    transitionStatus,
  };

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state,
        customStyleHookMapping,
        props: [
          {
            role: 'presentation',
            hidden: !mounted(),
            style: {
              'user-select': 'none',
              '-webkit-user-select': 'none',
            },
          },
          elementProps,
        ],
      }}
    />
  );
}

export namespace NavigationMenuBackdrop {
  export interface State {
    /**
     * If `true`, the popup is open.
     */
    open: Accessor<boolean>;
    /**
     * The transition status of the popup.
     */
    transitionStatus: Accessor<TransitionStatus>;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
