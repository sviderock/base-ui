'use client';
import { createEffect, onCleanup, splitProps } from 'solid-js';
import { getTarget } from '../../floating-ui-solid/utils';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { COMPONENT_PROPS_TO_OMIT, RenderElement } from '../../utils/useRenderElement';
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

  const { labelId, setLabelId, state, controlId } = useFieldRootContext(false);

  const id = useBaseUiId(() => local.id);
  const htmlFor = () => controlId() ?? undefined;

  createEffect(() => {
    if (controlId() != null || local.id) {
      setLabelId(id());
    }
    onCleanup(() => {
      setLabelId(undefined);
    });
  });

  return (
    <RenderElement
      element="label"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: state(),
        customStyleHookMapping: fieldValidityMapping,
        props: [
          {
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
          },
          elementProps,
        ],
      }}
    />
  );
}

export namespace FieldLabel {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'label', State> {}
}
