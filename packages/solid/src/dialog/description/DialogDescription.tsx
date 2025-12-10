'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useDialogRootContext } from '../root/DialogRootContext';

/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogDescription(componentProps: DialogDescription.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const { setDescriptionElementId } = useDialogRootContext();

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

export namespace DialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
