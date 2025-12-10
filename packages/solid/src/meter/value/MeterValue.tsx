'use client';
import { Show, type JSX } from 'solid-js';
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
  const [renderProps, , elementProps] = splitComponentProps(componentProps, []);

  const { value, formattedValue } = useMeterRootContext();

  const valueContent = (
    <Show
      when={typeof renderProps.children === 'function'}
      fallback={(formattedValue() || value()) ?? ''}
    >
      {renderProps.children?.(formattedValue(), value())}
    </Show>
  );

  const element = useRenderElement(
    'span',
    {
      class: renderProps.class,
      render: renderProps.render,
      children: valueContent,
      ref: componentProps.ref,
    },
    {
      props: [{ 'aria-hidden': true }, elementProps],
    },
  );

  return <>{element()}</>;
}

export namespace MeterValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', MeterRoot.State>, 'children'> {
    children?: null | ((formattedValue: string, value: number) => JSX.Element);
  }
}
