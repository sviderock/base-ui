'use client';
import { createEffect, onCleanup } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { usePopoverRootContext } from '../root/PopoverRootContext';

/**
 * A paragraph with additional information about the popover.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverDescription(componentProps: PopoverDescription.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { setDescriptionId } = usePopoverRootContext();

  const id = useBaseUiId(() => elementProps.id);

  createEffect(() => {
    setDescriptionId(id());
    onCleanup(() => {
      setDescriptionId(undefined);
    });
  });

  return (
    <RenderElement
      element="p"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{ props: [{ id: id() }, elementProps] }}
    />
  );
}

export namespace PopoverDescription {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'p', State> {}
}
