'use client';
import { onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { type BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useDialogRootContext } from '../root/DialogRootContext';

/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogTitle(componentProps: DialogTitle.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const { setCodependentRefs } = useDialogRootContext();

  const id = useBaseUiId(() => local.id);
  let ref: HTMLElement;

  onMount(() => {
    setCodependentRefs('title', { explicitId: id, ref: () => ref, id: () => local.id });
  });

  const element = useRenderElement('h2', componentProps, {
    ref: (el) => {
      ref = el;
    },
    props: [() => ({ id: id() }), elementProps],
  });

  return <>{element()}</>;
}

export namespace DialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}
