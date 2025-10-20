'use client';
import { createMemo, Show } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { RenderElement } from '../../utils/useRenderElement';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useSelectRootContext } from '../root/SelectRootContext';

const customStyleHookMapping: CustomStyleHookMapping<SelectArrow.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * Displays an element positioned against the select menu anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectArrow(componentProps: SelectArrow.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { store } = useSelectRootContext();
  const { side, align, refs, arrowStyles, arrowUncentered, alignItemWithTriggerActive } =
    useSelectPositionerContext();

  const state = createMemo<SelectArrow.State>(() => ({
    open: store.open,
    side: side(),
    align: align(),
    uncentered: arrowUncentered(),
  }));

  return (
    <Show when={alignItemWithTriggerActive() === false}>
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
          state: state(),
          props: [{ style: arrowStyles(), 'aria-hidden': true }, elementProps],
          customStyleHookMapping,
        }}
      />
    </Show>
  );
}

export namespace SelectArrow {
  export interface State {
    /**
     * Whether the select menu is currently open.
     */
    open: boolean;
    side: Side | 'none';
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
