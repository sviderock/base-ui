import { mergeProps as solidMergeProps } from 'solid-js';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { SwitchRoot } from '../root/SwitchRoot';
import { useSwitchRootContext } from '../root/SwitchRootContext';
import { styleHookMapping } from '../styleHooks';

/**
 * The movable part of the switch that indicates whether the switch is on or off.
 * Renders a `<span>`.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export function SwitchThumb(componentProps: SwitchThumb.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { state: fieldState } = useFieldRootContext();

  const state = useSwitchRootContext();
  const extendedState: SwitchThumb.State = solidMergeProps(fieldState, {
    get checked() {
      return state.checked();
    },
    get readOnly() {
      return state.readOnly();
    },
    get required() {
      return state.required();
    },
    get disabled() {
      return state.disabled() ?? fieldState.disabled;
    },
  });

  const element = useRenderElement('span', componentProps, {
    state: extendedState,
    props: elementProps,
    customStyleHookMapping: styleHookMapping,
  });

  return <>{element()}</>;
}

export namespace SwitchThumb {
  export interface Props extends BaseUIComponentProps<'span', State> {}

  export interface State extends SwitchRoot.State {}
}
