'use client';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { MeterRoot } from '../root/MeterRoot';
import { useMeterRootContext } from '../root/MeterRootContext';

/**
 * Visualizes the position of the value along the range.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export function MeterIndicator(componentProps: MeterIndicator.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { percentageValue } = useMeterRootContext();

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        props: [
          {
            style: {
              'inset-inline-start': 0,
              height: 'inherit',
              width: `${percentageValue()}%`,
            },
          },
          elementProps,
        ],
      }}
    />
  );
}

export namespace MeterIndicator {
  export interface Props extends BaseUIComponentProps<'div', MeterRoot.State> {}
}
