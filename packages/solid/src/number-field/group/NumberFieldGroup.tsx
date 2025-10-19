'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { styleHookMapping } from '../utils/styleHooks';

/**
 * Groups the input with the increment and decrement buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldGroup(componentProps: NumberFieldGroup.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { state } = useNumberFieldRootContext();

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: state(),
        props: [{ role: 'group' }, elementProps],
        customStyleHookMapping: styleHookMapping,
      }}
    />
  );
}

export namespace NumberFieldGroup {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
