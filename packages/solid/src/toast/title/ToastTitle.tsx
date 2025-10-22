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
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastTitle(componentProps: ToastTitle.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);
  const [shouldRender, setShouldRender] = createSignal(false);

  const { toast } = useToastRootContext();

  const safeChildren = children(() => shouldRender() && (componentProps.children ?? toast().title));

  const id = useId(() => local.id);

  const { setTitleId } = useToastRootContext();

  onMount(() => {
    setShouldRender(true);
  });

  createEffect(() => {
    if (!shouldRender()) {
      return;
    }

    setTitleId(id());

    onCleanup(() => {
      setTitleId(undefined);
    });
  });

  const state = createMemo<ToastTitle.State>(() => ({ type: toast().type }));

  const element = useRenderElement('h2', componentProps, {
    ref: forwardedRef,
    state,
    props: {
      ...elementProps,
      id,
      children,
    },
  });

  return (
    <Show when={Boolean(safeChildren())}>
      <RenderElement
        element="h2"
        componentProps={{ ...componentProps, children: safeChildren() }}
        ref={componentProps.ref}
        params={{ state: state(), props: [{ id: id() }, elementProps] }}
      />
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
