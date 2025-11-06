'use client';
import { createEffect, createMemo, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';

/**
 * An accessible label that is automatically associated with the fieldset.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export function FieldsetLegend(componentProps: FieldsetLegend.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const { disabled, setLegendId } = useFieldsetRootContext();

  const id = useBaseUiId(() => local.id);

  createEffect(() => {
    setLegendId(id());
    onCleanup(() => {
      setLegendId(undefined);
    });
  });

  const state = createMemo<FieldsetLegend.State>(() => ({
    disabled: disabled() ?? false,
  }));

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: state(),
        props: [{ id: id() }, elementProps],
      }}
    />
  );
}

export namespace FieldsetLegend {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
