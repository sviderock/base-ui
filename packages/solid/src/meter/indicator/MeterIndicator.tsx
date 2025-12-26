'use client';
import type { JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
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

  const element = useRenderElement('div', componentProps, {
    props: [
      {
        get style(): JSX.CSSProperties {
          return {
            'inset-inline-start': 0,
            height: 'inherit',
            width: `${percentageValue()}%`,
          };
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace MeterIndicator {
  export interface Props extends BaseUIComponentProps<'div', MeterRoot.State> {}
}
