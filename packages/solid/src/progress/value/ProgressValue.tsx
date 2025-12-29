'use client';
import { type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { ProgressRoot } from '../root/ProgressRoot';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStyleHookMapping } from '../root/styleHooks';
/**
 * A text label displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export function ProgressValue(componentProps: ProgressValue.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, ['children']);

  const { value, formattedValue, state } = useProgressRootContext();

  const formattedValueArg = () => (value() == null ? 'indeterminate' : formattedValue());
  const formattedValueDisplay = () => (value() == null ? null : formattedValue());

  const element = useRenderElement('span', componentProps, {
    state,
    props: [{ 'aria-hidden': true }, elementProps],
    customStyleHookMapping: progressStyleHookMapping,
    get children() {
      return componentProps.children?.(formattedValueArg(), value()) ?? formattedValueDisplay();
    },
  });

  return <>{element()}</>;
}

export namespace ProgressValue {
  export interface Props
    extends Omit<BaseUIComponentProps<'span', ProgressRoot.State>, 'children'> {
    children?: ((formattedValue: string | null, value: number | null) => JSX.Element) | null;
  }
}
