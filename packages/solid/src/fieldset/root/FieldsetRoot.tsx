'use client';
import { createMemo, createSignal } from 'solid-js';
import { access, splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { FieldsetRootContext } from './FieldsetRootContext';

/**
 * Groups the fieldset legend and the associated fields.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export function FieldsetRoot(componentProps: FieldsetRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled']);
  const disabled = () => access(local.disabled) ?? false;

  const [legendId, setLegendId] = createSignal<string>();

  const state = createMemo<FieldsetRoot.State>(() => ({
    disabled: disabled(),
  }));

  const contextValue: FieldsetRootContext = {
    legendId,
    setLegendId,
    disabled,
  };

  const element = useRenderElement('fieldset', componentProps, {
    state,
    props: [
      () => ({
        'aria-labelledby': legendId(),
      }),
      elementProps,
    ],
  });

  return (
    <FieldsetRootContext.Provider value={contextValue}>{element()}</FieldsetRootContext.Provider>
  );
}

export namespace FieldsetRoot {
  export type State = {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  };

  export interface Props extends BaseUIComponentProps<'fieldset', State> {}
}
