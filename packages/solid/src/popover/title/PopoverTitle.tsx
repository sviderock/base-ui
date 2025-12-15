'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { usePopoverRootContext } from '../root/PopoverRootContext';

/**
 * A heading that labels the popover.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverTitle(componentProps: PopoverTitle.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { setTitleId } = usePopoverRootContext();

  const id = useBaseUiId(() => elementProps.id);

  createEffect(() => {
    setTitleId(id());
    onCleanup(() => {
      setTitleId(undefined);
    });
  });

  const element = useRenderElement('h2', componentProps, {
    props: [() => ({ id: id() }), elementProps],
  });

  return <>{element()}</>;
}

export namespace PopoverTitle {
  export interface State {}

  export interface Props
    extends BaseUIComponentProps<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', State> {}
}
