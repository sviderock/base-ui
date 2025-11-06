'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { type BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { useDialogRootContext } from '../root/DialogRootContext';

/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogTitle(componentProps: DialogTitle.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const { setTitleElementId } = useDialogRootContext();

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

export namespace DialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}
