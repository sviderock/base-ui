'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';

/**
 * A paragraph with additional information about the field.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldDescription(componentProps: FieldDescription.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const { state } = useFieldRootContext(false);

  const id = useBaseUiId(() => local.id);

  const { setMessageIds } = useFieldRootContext();

  createEffect(() => {
    const idValue = id();
    if (!idValue) {
      return;
    }

    setMessageIds((v) => v.concat(idValue));

    onCleanup(() => {
      setMessageIds((v) => v.filter((item) => item !== idValue));
    });
  });

  const element = useRenderElement('p', componentProps, {
    state,
    customStyleHookMapping: fieldValidityMapping,
    props: [() => ({ id: id() }), elementProps],
  });

  return <>{element()}</>;
}

export namespace FieldDescription {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'p', State> {}
}
