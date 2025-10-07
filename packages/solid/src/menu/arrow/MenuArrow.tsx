'use client';
import type { Accessor } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { RenderElement } from '../../utils/useRenderElement';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useMenuRootContext } from '../root/MenuRootContext';

/**
 * Displays an element positioned against the menu anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuArrow(componentProps: MenuArrow.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open } = useMenuRootContext();
  const { refs, side, align, arrowUncentered, arrowStyles } = useMenuPositionerContext();

  const state: MenuArrow.State = {
    open,
    side,
    align,
    uncentered: arrowUncentered,
  };

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={(el) => {
        refs.setArrowRef(el);
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{
        state,
        customStyleHookMapping: popupStateMapping,
        props: [{ style: arrowStyles(), 'aria-hidden': true }, elementProps],
      }}
    />
  );
}

export namespace MenuArrow {
  export interface State {
    /**
     * Whether the menu is currently open.
     */
    open: Accessor<boolean>;
    side: Accessor<Side>;
    align: Accessor<Align>;
    uncentered: Accessor<boolean>;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
