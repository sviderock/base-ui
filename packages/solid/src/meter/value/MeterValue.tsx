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
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { value, formattedValue } = useMeterRootContext();

  const element = useRenderElement(
    'span',
    {
      ...componentProps,
      ref: (el) => {
        // eslint-disable-next-line solid/reactivity
        componentProps.ref = el;
      },
      get children() {
        return (
          <Show
            when={typeof componentProps.children === 'function'}
            fallback={(formattedValue() || value()) ?? ''}
          >
            {componentProps.children?.(formattedValue(), value())}
          </Show>
        );
      },
    },
    { props: [{ 'aria-hidden': true }, elementProps] },
  );

  return <>{element()}</>;
}

export namespace MeterValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', MeterRoot.State>, 'children'> {
    children?: null | ((formattedValue: string, value: number) => JSX.Element);
  }
}
