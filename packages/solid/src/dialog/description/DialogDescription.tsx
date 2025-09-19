'use client';
import { createEffect, onCleanup, splitProps, type JSX } from 'solid-js';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { useDialogRootContext } from '../root/DialogRootContext';

/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogDescription(componentProps: DialogDescription.Props) {
  const [local, elementProps] = splitProps(componentProps, ['render', 'class', 'id']);
  const { setDescriptionElementId } = useDialogRootContext();

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
      params={{ props: [{ id: id() }, elementProps as JSX.HTMLAttributes<HTMLParagraphElement>] }}
    />
  );
}

export namespace DialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
