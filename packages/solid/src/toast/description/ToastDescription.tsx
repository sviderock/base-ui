'use client';
import { createMemo, onCleanup, onMount, Show } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useId } from '../../utils/useId';
import { RenderElement } from '../../utils/useRenderElement';
import { useToastRootContext } from '../root/ToastRootContext';

/**
 * A description that describes the toast.
 * Can be used as the default message for the toast when no title is provided.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastDescription(componentProps: ToastDescription.Props) {
  const [renderProps, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const { toast } = useToastRootContext();

  const id = useId(() => local.id);

  const { setDescriptionIdAccessor } = useToastRootContext();

  onMount(() => {
    setDescriptionIdAccessor(id);
    onCleanup(() => {
      setDescriptionIdAccessor(() => undefined);
    });
  });

  const state = createMemo<ToastDescription.State>(() => ({ type: toast().type }));

  return (
    <Show when={Boolean(componentProps.children ?? toast().description)}>
      <RenderElement
        element="p"
        componentProps={{
          render: renderProps.render,
          class: renderProps.class,
        }}
        ref={componentProps.ref}
        params={{
          state: state(),
          props: [{ id: id() }, elementProps],
        }}
      >
        {componentProps.children ?? toast().description}
      </RenderElement>
    </Show>
  );
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
