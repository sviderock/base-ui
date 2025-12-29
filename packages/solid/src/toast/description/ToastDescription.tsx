'use client';
import { onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useId } from '../../utils/useId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useToastRootContext } from '../root/ToastRootContext';

/**
 * A description that describes the toast.
 * Can be used as the default message for the toast when no title is provided.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastDescription(componentProps: ToastDescription.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const { toast } = useToastRootContext();

  const id = useId(() => local.id);
  let ref: HTMLElement;

  const { setCodependentRefs } = useToastRootContext();

  onMount(() => {
    setCodependentRefs('description', { explicitId: id, ref: () => ref, id: () => local.id });
  });

  const state: ToastDescription.State = {
    get type() {
      return toast().type;
    },
  };

  const element = useRenderElement('p', componentProps, {
    enabled: () => Boolean(componentProps.children ?? toast().description),
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
    get children() {
      return <>{componentProps.children ?? toast().description}</>;
    },
  });

  return <>{element()}</>;
}

export namespace ToastDescription {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends BaseUIComponentProps<'p', State> {}
}
