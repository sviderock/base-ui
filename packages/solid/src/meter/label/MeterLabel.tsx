'use client';
import { onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import type { MeterRoot } from '../root/MeterRoot';
import { useMeterRootContext } from '../root/MeterRootContext';

/**
 * An accessible label for the meter.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export function MeterLabel(componentProps: MeterLabel.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const id = useBaseUiId(() => local.id);
  let ref!: HTMLElement;

  const { setCodependentRefs } = useMeterRootContext();

  onMount(() => {
    setCodependentRefs('label', { explicitId: id, ref: () => ref, id: () => local.id });
  });

  const element = useRenderElement('span', componentProps, {
    ref: (el) => {
      ref = el;
    },
    props: [
      {
        get id() {
          return id();
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace MeterLabel {
  export interface Props extends BaseUIComponentProps<'span', MeterRoot.State> {}
}
