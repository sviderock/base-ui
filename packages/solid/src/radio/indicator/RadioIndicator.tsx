'use client';
import { createMemo, Show } from 'solid-js';
import { type MaybeAccessor, access, splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { RenderElement } from '../../utils/useRenderElement';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useRadioRootContext } from '../root/RadioRootContext';
import { customStyleHookMapping } from '../utils/customStyleHookMapping';

/**
 * Indicates whether the radio button is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
export function RadioIndicator(componentProps: RadioIndicator.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['keepMounted']);
  const keepMounted = () => access(local.keepMounted) ?? false;

  const rootState = useRadioRootContext();

  const rendered = () => rootState.checked();

  const { transitionStatus, setMounted } = useTransitionStatus(rendered);

  const state = createMemo<RadioIndicator.State>(() => ({
    disabled: rootState.disabled(),
    touched: rootState.touched(),
    dirty: rootState.dirty(),
    valid: rootState.valid(),
    filled: rootState.filled(),
    focused: rootState.focused(),
    readOnly: rootState.readOnly(),
    checked: rootState.checked(),
    required: rootState.required(),
    transitionStatus: transitionStatus(),
  }));

  let indicatorRef = null as HTMLSpanElement | null | undefined;

  const shouldRender = () => keepMounted() || rendered();

  useOpenChangeComplete({
    open: rendered,
    ref: () => indicatorRef,
    onComplete() {
      if (!rendered()) {
        setMounted(false);
      }
    },
  });

  return (
    <Show when={shouldRender()}>
      <RenderElement
        element="span"
        componentProps={componentProps}
        ref={(el) => {
          if (typeof componentProps.ref === 'function') {
            componentProps.ref(el);
          } else {
            componentProps.ref = el;
          }
          indicatorRef = el;
        }}
        params={{
          enabled: shouldRender(),
          state: state(),
          customStyleHookMapping,
          props: elementProps,
        }}
      />
    </Show>
  );
}

export namespace RadioIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the HTML element in the DOM when the radio button is inactive.
     * @default false
     */
    keepMounted?: MaybeAccessor<boolean | undefined>;
  }

  export interface State {
    /**
     * Whether the radio button is currently selected.
     */
    checked: boolean;
    transitionStatus: TransitionStatus;
  }
}
