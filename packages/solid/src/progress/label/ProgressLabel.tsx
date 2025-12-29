'use client';
import { onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
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
  let ref!: HTMLElement;

  const { setCodependentRefs, state } = useProgressRootContext();

  onMount(() => {
    setCodependentRefs('label', { explicitId: id, ref: () => ref, id: () => local.id });
  });

  const element = useRenderElement('span', componentProps, {
    state,
    ref: (el) => {
      ref = el;
    },
    props: [
      {
        get id() {
          return id();
        },
      },
      elementProps,
    ],
    customStyleHookMapping: progressStyleHookMapping,
  });

  return <>{element()}</>;
}

export namespace ProgressLabel {
  export interface Props extends BaseUIComponentProps<'span', ProgressRoot.State> {}
}
