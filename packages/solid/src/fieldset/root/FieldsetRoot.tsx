import { createEffect, createSignal, on, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { splitComponentProps, type CodependentRefs } from '../../solid-helpers';
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
  const disabled = () => local.disabled ?? false;

  const [legendId, setLegendId] = createSignal<string | undefined>();
  const [codependentRefs, setCodependentRefs] = createStore<CodependentRefs<['legend']>>({});

  const state: FieldsetRoot.State = {
    get disabled() {
      return disabled();
    },
  };

  const contextValue: FieldsetRootContext = {
    legendId,
    codependentRefs,
    setCodependentRefs,
    disabled,
  };

  createEffect(
    on(
      () => codependentRefs.legend,
      (legend) => {
        if (legend) {
          setLegendId(legend.id() ?? legend.explicitId());
        }

        onCleanup(() => {
          setLegendId(undefined);
        });
      },
    ),
  );

  const element = useRenderElement('fieldset', componentProps, {
    state,
    props: [
      {
        get 'aria-labelledby'() {
          return legendId();
        },
      },
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
