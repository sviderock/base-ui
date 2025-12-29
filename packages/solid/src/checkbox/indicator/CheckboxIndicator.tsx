'use client';
import { mergeProps, Show, splitProps } from 'solid-js';
import { fieldValidityMapping } from '../../field/utils/constants';
import { access, MaybeAccessor } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import type { CheckboxRoot } from '../root/CheckboxRoot';
import { useCheckboxRootContext } from '../root/CheckboxRootContext';
import { useCustomStyleHookMapping } from '../utils/useCustomStyleHookMapping';

/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export function CheckboxIndicator(componentProps: CheckboxIndicator.Props) {
  const [local, elementProps] = splitProps(componentProps, ['keepMounted']);
  const keepMounted = () => access(local.keepMounted) ?? false;

  const rootState = useCheckboxRootContext();

  const rendered = () => rootState.checked || rootState.indeterminate;

  const { transitionStatus, setMounted } = useTransitionStatus(rendered);

  let indicatorRef = null as HTMLSpanElement | null | undefined;

  useOpenChangeComplete({
    open: rendered,
    ref: () => indicatorRef,
    onComplete() {
      if (!rendered()) {
        setMounted(false);
      }
    },
  });

  const baseStyleHookMapping = useCustomStyleHookMapping(rootState);

  const customStyleHookMapping: CustomStyleHookMapping<CheckboxIndicator.State> = {
    ...baseStyleHookMapping,
    ...transitionStatusMapping,
    ...fieldValidityMapping,
  };

  const shouldRender = () => keepMounted() || rendered();

  const indicatorState: CheckboxIndicator.State = mergeProps(rootState, {
    get transitionStatus() {
      return transitionStatus();
    },
  });

  const element = useRenderElement('span', componentProps, {
    state: indicatorState,
    ref: (el) => {
      indicatorRef = el;
    },
    customStyleHookMapping,
    props: elementProps,
    enabled: shouldRender,
  });

  return <Show when={shouldRender()}>{element()}</Show>;
}

export namespace CheckboxIndicator {
  export interface State extends CheckboxRoot.State {
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the element in the DOM when the checkbox is not checked.
     * @default false
     */
    keepMounted?: MaybeAccessor<boolean | undefined>;
  }
}
