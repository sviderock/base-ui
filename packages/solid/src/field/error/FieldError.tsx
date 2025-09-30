'use client';
import { children, createEffect, createMemo, For, Match, onCleanup, Show, Switch } from 'solid-js';
import { useFormContext } from '../../form/FormContext';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';

/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldError(componentProps: FieldError.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id', 'match']);
  const match = () => access(local.match);

  const id = useBaseUiId(() => local.id);

  const { validityData, state, name, setMessageIds } = useFieldRootContext(false);

  const { errors } = useFormContext();

  const formError = () => (name() ? errors()[name()!] : null);

  const rendered = createMemo(() => {
    let isRendered = false;
    const m = match();
    if (formError() || m === true) {
      isRendered = true;
    } else if (m) {
      isRendered = Boolean(validityData.state[m]);
    } else {
      isRendered = validityData.state.valid === false;
    }
    return isRendered;
  });

  createEffect(() => {
    const idValue = id();
    if (!rendered() || !idValue) {
      return;
    }

    setMessageIds((v) => v.concat(idValue));

    onCleanup(() => {
      setMessageIds((v) => v.filter((item) => item !== idValue));
    });
  });

  return (
    <Show when={rendered()} fallback={null}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{
          state: state(),
          customStyleHookMapping: fieldValidityMapping,
          props: [{ id: id() }, elementProps],
        }}
      >
        <Switch fallback={validityData.error}>
          <Match when={formError()}>{formError()}</Match>
          <Match when={validityData.errors.length > 1}>
            <ul>
              <For each={validityData.errors}>{(message) => <li>{message}</li>}</For>
            </ul>
          </Match>
        </Switch>
      </RenderElement>
    </Show>
  );
}

export namespace FieldError {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines whether to show the error message according to the field’s
     * [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState).
     * Specifying `true` will always show the error message, and lets external libraries
     * control the visibility.
     */
    match?: MaybeAccessor<boolean | keyof ValidityState | undefined>;
  }
}
