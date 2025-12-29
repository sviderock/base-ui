'use client';
import { onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDialogRootContext } from '../root/DialogRootContext';

/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogDescription(componentProps: DialogDescription.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const { setCodependentRefs } = useDialogRootContext();

  const id = useBaseUiId(() => local.id);

  let ref: HTMLElement;

  onMount(() => {
    setCodependentRefs('description', { explicitId: id, ref: () => ref, id: () => local.id });
  });

  const element = useRenderElement('p', componentProps, {
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

export namespace DialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
