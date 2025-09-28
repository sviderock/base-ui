'use client';
import { createEffect, onCleanup, splitProps } from 'solid-js';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 * A paragraph with additional information about the alert dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogDescription(componentProps: AlertDialogDescription.Props) {
  const [local, elementProps] = splitProps(componentProps, ['render', 'class', 'id']);
  const { setDescriptionElementId } = useAlertDialogRootContext();

  const id = useBaseUiId(() => local.id);

  createEffect(() => {
    setDescriptionElementId(id());
    onCleanup(() => {
      setDescriptionElementId(undefined);
    });
  });

  return (
    <RenderElement
      element="p"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{ props: [{ id: id() }, elementProps] }}
    />
  );
}

export namespace AlertDialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
