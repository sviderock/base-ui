'use client';
import { Show, type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
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

  return (
    <RenderElement
      element="span"
      componentProps={{ class: renderProps.class, render: renderProps.render }}
      ref={componentProps.ref}
      params={{
        props: [{ 'aria-hidden': true }, elementProps],
      }}
    >
      <Show
        when={typeof renderProps.children === 'function'}
        fallback={(formattedValue() || value()) ?? ''}
      >
        {renderProps.children?.(formattedValue(), value())}
      </Show>
    </RenderElement>
  );
}

export namespace MeterValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', MeterRoot.State>, 'children'> {
    children?: null | ((formattedValue: string, value: number) => JSX.Element);
  }
}
