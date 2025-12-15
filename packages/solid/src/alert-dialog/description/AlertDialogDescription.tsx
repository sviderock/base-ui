'use client';
import { onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 * A paragraph with additional information about the alert dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogDescription(componentProps: AlertDialogDescription.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const { setCodependentRefs } = useAlertDialogRootContext();

  const id = useBaseUiId(() => local.id);

  let ref: HTMLElement;

  onMount(() => {
    setCodependentRefs('description', { explicitId: id, ref: () => ref, id: () => local.id });
  });

  const element = useRenderElement('p', componentProps, {
    ref: (el) => {
      ref = el;
    },
    props: [() => ({ id: id() }), elementProps],
  });

  return <>{element()}</>;
}

export namespace AlertDialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
