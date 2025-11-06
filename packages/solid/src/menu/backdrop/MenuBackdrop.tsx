'use client';
import { createMemo } from 'solid-js';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { splitComponentProps } from '../../solid-helpers';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useMenuRootContext } from '../root/MenuRootContext';

const customStyleHookMapping: CustomStyleHookMapping<MenuBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuBackdrop(componentProps: MenuBackdrop.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open, mounted, transitionStatus, lastOpenChangeReason } = useMenuRootContext();
  const contextMenuContext = useContextMenuRootContext();

  const state = createMemo<MenuBackdrop.State>(() => ({
    open: open(),
    transitionStatus: transitionStatus(),
  }));

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={(el) => {
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }

        if (contextMenuContext) {
          contextMenuContext.refs.backdropRef = el;
        }
      }}
      params={{
        state: state(),
        customStyleHookMapping,
        props: [
          {
            role: 'presentation',
            hidden: !mounted(),
            style: {
              'pointer-events': lastOpenChangeReason() === 'trigger-hover' ? 'none' : undefined,
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

export namespace MenuBackdrop {
  export interface State {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
