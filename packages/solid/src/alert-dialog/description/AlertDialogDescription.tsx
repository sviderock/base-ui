'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 * A paragraph with additional information about the alert dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogDescription(componentProps: AlertDialogDescription.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const { setDescriptionElementId } = useAlertDialogRootContext();

  const id = useBaseUiId(() => local.id);

  createEffect(() => {
    setDescriptionElementId(id);
    onCleanup(() => {
      setDescriptionElementId(() => undefined);
    });
  });

  const element = useRenderElement('p', componentProps, {
    props: [() => ({ id: id() }), elementProps],
  });

  return <>{element()}</>;
}

export namespace AlertDialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
