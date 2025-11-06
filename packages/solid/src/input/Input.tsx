'use client';
import { Field } from '../field';
import type { BaseUIComponentProps } from '../utils/types';

/**
 * A native input element that automatically works with [Field](https://base-ui.com/react/components/field).
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Input](https://base-ui.com/react/components/input)
 */
export function Input(props: Input.Props) {
  return <Field.Control {...props} />;
}

export namespace Input {
  export interface Props extends BaseUIComponentProps<'input', State> {
    /**
     * Callback fired when the `value` changes. Use when controlled.
     */
    onValueChange?: Field.Control.Props['onValueChange'];
    defaultValue?: Field.Control.Props['defaultValue'];
  }

  export interface State extends Field.Control.State {}
}
