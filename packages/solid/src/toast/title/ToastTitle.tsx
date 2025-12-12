'use client';
import { createMemo, onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useId } from '../../utils/useId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useToastRootContext } from '../root/ToastRootContext';

/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastTitle(componentProps: ToastTitle.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const { toast } = useToastRootContext();

  const id = useId(() => local.id);
  let ref: HTMLElement;

  const { setCodependentRefs } = useToastRootContext();

  onMount(() => {
    setCodependentRefs('title', { explicitId: id, ref: () => ref, id: () => local.id });
  });

  const state = createMemo<ToastTitle.State>(() => ({ type: toast().type }));

  const element = useRenderElement('h2', componentProps, {
    enabled: () => Boolean(componentProps.children ?? toast().title),
    state,
    ref: (el) => {
      ref = el;
    },
    props: [() => ({ id: id() }), elementProps],
    children: () => componentProps.children ?? toast().title,
  });

  return <>{element()}</>;
}

export namespace ToastTitle {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends BaseUIComponentProps<'h2', State> {}
}
