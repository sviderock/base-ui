'use client';
import { createEffect, onCleanup, splitProps } from 'solid-js';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogTitle(componentProps: AlertDialogTitle.Props) {
  const [local, elementProps] = splitProps(componentProps, ['render', 'class', 'id']);
  const { setTitleElementId } = useAlertDialogRootContext();

  const id = useBaseUiId(() => local.id);

  createEffect(() => {
    setTitleElementId(id());
    onCleanup(() => {
      setTitleElementId(undefined);
    });
  });

  return (
    <RenderElement
      element="h2"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{ props: [{ id: id() }, elementProps] }}
    />
  );
}

export namespace AlertDialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}
