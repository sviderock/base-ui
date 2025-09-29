'use client';
import { createEffect, onCleanup, splitProps } from 'solid-js';
import type { MaybeAccessor } from '../../solid-helpers';
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
  const [local, elementProps] = splitProps(componentProps, ['class', 'render', 'id', 'children']);

  const { disabled, setLegendId } = useFieldsetRootContext();

  const id = useBaseUiId(() => local.id);

  createEffect(() => {
    setLegendId(id());
    onCleanup(() => {
      setLegendId(undefined);
    });
  });

  const state: FieldsetLegend.State = {
    disabled: () => disabled() ?? false,
  };

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state,
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
    disabled: MaybeAccessor<boolean>;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
