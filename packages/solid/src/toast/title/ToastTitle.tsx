'use client';
import { createMemo, onCleanup, onMount, Show } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useId } from '../../utils/useId';
import { RenderElement } from '../../utils/useRenderElement';
import { useToastRootContext } from '../root/ToastRootContext';

/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastTitle(componentProps: ToastTitle.Props) {
  const [renderProps, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const { toast } = useToastRootContext();

  const id = useId(() => local.id);

  const { setTitleId } = useToastRootContext();

  onMount(() => {
    setTitleId(id);
    onCleanup(() => {
      setTitleId(() => undefined);
    });
  });

  const state = createMemo<ToastTitle.State>(() => ({ type: toast().type }));

  return (
    <Show when={Boolean(componentProps.children ?? toast().title)}>
      <RenderElement
        element="h2"
        componentProps={{
          render: renderProps.render,
          class: renderProps.class,
        }}
        ref={componentProps.ref}
        params={{
          state: state(),
          props: [{ id: id() }, elementProps],
          enabled: Boolean(componentProps.children ?? toast().title),
        }}
      >
        {componentProps.children ?? toast().title}
      </RenderElement>
    </Show>
  );
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
