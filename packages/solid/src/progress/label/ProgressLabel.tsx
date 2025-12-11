'use client';
import { createRenderEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { ProgressRoot } from '../root/ProgressRoot';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStyleHookMapping } from '../root/styleHooks';

/**
 * An accessible label for the progress bar.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export function ProgressLabel(componentProps: ProgressLabel.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const id = useBaseUiId(() => local.id);

  const { setLabelId, state } = useProgressRootContext();

  createRenderEffect(() => {
    setLabelId(id());
  });

  onCleanup(() => {
    setLabelId(undefined);
  });

  const element = useRenderElement('span', componentProps, {
    state,
    props: [() => ({ id: id() }), elementProps],
    customStyleHookMapping: progressStyleHookMapping,
  });

  return <>{element()}</>;
}

export namespace ProgressLabel {
  export interface Props extends BaseUIComponentProps<'span', ProgressRoot.State> {}
}
