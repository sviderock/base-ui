'use client';
import { type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { MeterRoot } from '../root/MeterRoot';
import { useMeterRootContext } from '../root/MeterRootContext';

/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export function MeterValue(componentProps: MeterValue.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { value, formattedValue } = useMeterRootContext();

  const element = useRenderElement('span', componentProps, {
    props: [{ 'aria-hidden': true }, elementProps],
    children: () =>
      componentProps.children?.(formattedValue(), value()) ?? (formattedValue() || value()) ?? '',
  });

  return <>{element()}</>;
}

export namespace MeterValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', MeterRoot.State>, 'children'> {
    children?: Exclude<BaseUIComponentProps<'span', MeterRoot.State>['children'], Function> &
      ((formattedValue: string, value: number) => JSX.Element);
  }
}
