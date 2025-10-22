'use client';
import {
  children,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
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
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const [shouldRender, setShouldRender] = createSignal(false);

  const { toast } = useToastRootContext();

  const safeChildren = children(
    () => shouldRender() && (componentProps.children ?? toast().description),
  );

  const id = useId(() => local.id);

  const { setDescriptionId } = useToastRootContext();

  onMount(() => {
    setShouldRender(true);
  });

  createEffect(() => {
    if (!shouldRender()) {
      return;
    }

    setDescriptionId(id());

    onCleanup(() => {
      setDescriptionId(undefined);
    });
  });

  const state = createMemo<ToastDescription.State>(() => ({ type: toast().type }));

  return (
    <Show when={Boolean(safeChildren())}>
      <RenderElement
        element="p"
        componentProps={{ ...componentProps, children: safeChildren() }}
        ref={componentProps.ref}
        params={{
          state: state(),
          props: [{ id: id() }, elementProps],
        }}
      />
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
