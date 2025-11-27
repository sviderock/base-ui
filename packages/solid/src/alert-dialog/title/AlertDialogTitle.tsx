'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogTitle(componentProps: AlertDialogTitle.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const { setTitleElementId } = useAlertDialogRootContext();

  const id = useBaseUiId(local.id);

  createEffect(() => {
    setTitleElementId(id);
    onCleanup(() => {
      setTitleElementId(() => undefined);
    });
  });

  const element = useRenderElement('h2', componentProps, {
    props: [() => ({ id: id() }), elementProps],
  });

  return <>{element}</>;
}

export namespace AlertDialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}
