'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
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

  const { setLabelId } = useMeterRootContext();

  createEffect(() => {
    setLabelId(id());
    onCleanup(() => setLabelId(undefined));
  });

  return (
    <RenderElement
      element="span"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{ props: [{ id: id() }, elementProps] }}
    />
  );
}

export namespace MeterLabel {
  export interface Props extends BaseUIComponentProps<'span', MeterRoot.State> {}
}
