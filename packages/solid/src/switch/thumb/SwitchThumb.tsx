'use client';
import { createMemo } from 'solid-js';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
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
  const extendedState = createMemo(() => ({ ...fieldState(), ...state }));

  return (
    <RenderElement
      element="span"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: extendedState(),
        props: elementProps,
        customStyleHookMapping: styleHookMapping,
      }}
    />
  );
}

export namespace SwitchThumb {
  export interface Props extends BaseUIComponentProps<'span', State> {}

  export interface State extends SwitchRoot.State {}
}
