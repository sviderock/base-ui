'use client';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { MeterRoot } from '../root/MeterRoot';

/**
 * Contains the meter indicator and represents the entire range of the meter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export function MeterTrack(componentProps: MeterTrack.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const element = useRenderElement('div', componentProps, {
    props: elementProps,
  });

  return <>{element()}</>;
}

export namespace MeterTrack {
  export interface Props extends BaseUIComponentProps<'div', MeterRoot.State> {}
}
