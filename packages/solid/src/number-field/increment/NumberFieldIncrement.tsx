'use client';
import { access, splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import { styleHookMapping } from '../utils/styleHooks';

/**
 * A stepper button that increases the field value when clicked.
 * Renders an `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldIncrement(componentProps: NumberFieldIncrement.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled']);
  const disabledProp = () => access(local.disabled) ?? false;

  const {
    disabled: contextDisabled,
    getStepAmount,
    id,
    incrementValue,
    inputValue,
    intentionalTouchCheckTimeout,
    locale,
    maxWithDefault,
    minWithDefault,
    readOnly,
    setValue,
    startAutoChange,
    state,
    stopAutoChange,
    value,
    refs,
  } = useNumberFieldRootContext();

  const disabled = () => disabledProp() || contextDisabled();

  const { props } = useNumberFieldButton({
    isIncrement: true,
    startAutoChange,
    stopAutoChange,
    minWithDefault,
    maxWithDefault,
    value,
    inputValue,
    disabled,
    readOnly,
    id,
    setValue,
    getStepAmount,
    incrementValue,
    intentionalTouchCheckTimeout,
    locale,
    refs,
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
  });

  const element = useRenderElement('button', componentProps, {
    state,
    ref: buttonRef,
    props: [props, elementProps, getButtonProps],
    customStyleHookMapping: styleHookMapping,
  });

  return <>{element()}</>;
}

export namespace NumberFieldIncrement {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
