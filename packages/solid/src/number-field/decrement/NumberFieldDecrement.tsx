'use client';
import { access, splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useNumberFieldButton } from '../root/useNumberFieldButton';
import { styleHookMapping } from '../utils/styleHooks';

/**
 * A stepper button that decreases the field value when clicked.
 * Renders an `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldDecrement(componentProps: NumberFieldDecrement.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled']);
  const disabledProp = () => access(local.disabled) ?? false;

  const {
    disabled: contextDisabled,
    getStepAmount,
    id,
    incrementValue,
    inputValue,
    intentionalTouchCheckTimeout,
    maxWithDefault,
    minWithDefault,
    readOnly,
    setValue,
    startAutoChange,
    state,
    stopAutoChange,
    value,
    locale,
    refs,
  } = useNumberFieldRootContext();

  const disabled = () => disabledProp() || contextDisabled();

  const { props } = useNumberFieldButton({
    isIncrement: false,
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

  return (
    <RenderElement
      element="button"
      componentProps={componentProps}
      ref={(el) => {
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
        buttonRef(el);
      }}
      params={{
        state: state(),
        props: [props(), elementProps, getButtonProps],
        customStyleHookMapping: styleHookMapping,
      }}
    />
  );
}

export namespace NumberFieldDecrement {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
