'use client';
import { createSignal, splitProps } from 'solid-js';
import { type MaybeAccessor, access } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { FieldsetRootContext } from './FieldsetRootContext';

/**
 * Groups the fieldset legend and the associated fields.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export function FieldsetRoot(componentProps: FieldsetRoot.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'class',
    'render',
    'disabled',
    'children',
  ]);
  const disabled = () => access(local.disabled) ?? false;

  const [legendId, setLegendId] = createSignal<string>();

  const state: FieldsetRoot.State = { disabled };

  const contextValue: FieldsetRootContext = {
    legendId,
    setLegendId,
    disabled,
  };

  return (
    <FieldsetRootContext.Provider value={contextValue}>
      <RenderElement
        element="fieldset"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{
          state,
          props: [
            {
              'aria-labelledby': legendId(),
            },
            elementProps,
          ],
        }}
      />
    </FieldsetRootContext.Provider>
  );
}

export namespace FieldsetRoot {
  export type State = {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: MaybeAccessor<boolean>;
  };

  export interface Props extends BaseUIComponentProps<'fieldset', State> {}
}
