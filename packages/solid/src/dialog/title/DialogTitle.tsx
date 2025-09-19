'use client';
import { createEffect, onCleanup, splitProps, type JSX } from 'solid-js';
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
  const [local, elementProps] = splitProps(componentProps, ['render', 'class', 'id']);
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
      params={{ props: [{ id: id() }, elementProps as JSX.HTMLAttributes<HTMLHeadingElement>] }}
    />
  );
}

export namespace DialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}
