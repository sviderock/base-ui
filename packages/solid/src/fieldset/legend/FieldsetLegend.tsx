import { onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';

/**
 * An accessible label that is automatically associated with the fieldset.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export function FieldsetLegend(componentProps: FieldsetLegend.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const { disabled, setCodependentRefs } = useFieldsetRootContext();

  const id = useBaseUiId(() => local.id);
  let ref!: HTMLElement;

  onMount(() => {
    setCodependentRefs('legend', { explicitId: id, ref: () => ref, id: () => local.id });
  });

  const state: FieldsetLegend.State = {
    get disabled() {
      return disabled() ?? false;
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
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

export namespace FieldsetLegend {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
