'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
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

  createEffect(() => {
    setLabelId(id());
    onCleanup(() => setLabelId(undefined));
  });

  return (
    <RenderElement
      element="span"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: state(),
        props: [{ id: id() }, elementProps],
        customStyleHookMapping: progressStyleHookMapping,
      }}
    />
  );
}

export namespace ProgressLabel {
  export interface Props extends BaseUIComponentProps<'span', ProgressRoot.State> {}
}
