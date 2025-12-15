'use client';
import { onMount } from 'solid-js';
import { getTarget } from '../../floating-ui-solid/utils';
import { access, splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';

/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldLabel(componentProps: FieldLabel.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const idProp = () => access(local.id);

  const { labelId, state, controlId, setCodependentRefs } = useFieldRootContext(false);

  const id = useBaseUiId(idProp);
  const htmlFor = () => controlId() ?? undefined;
  let ref: HTMLElement;

  onMount(() => {
    setCodependentRefs('label', { explicitId: id, ref: () => ref, id: idProp });
  });

  const element = useRenderElement('label', componentProps, {
    state,
    ref: (el) => {
      ref = el;
    },
    customStyleHookMapping: fieldValidityMapping,
    props: [
      () => ({
        id: labelId(),
        for: htmlFor(),
        onMouseDown(event) {
          const target = getTarget(event) as HTMLElement | null;
          if (target?.closest('button,input,select,textarea')) {
            return;
          }

          // Prevent text selection when double clicking label.
          if (!event.defaultPrevented && event.detail > 1) {
            event.preventDefault();
          }
        },
      }),
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace FieldLabel {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'label', State> {}
}
