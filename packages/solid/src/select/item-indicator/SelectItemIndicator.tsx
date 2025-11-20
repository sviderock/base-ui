'use client';
import { createMemo, type JSX, Show } from 'solid-js';
import { access, type MaybeAccessor, splitComponentProps } from '../../solid-helpers';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { RenderElement } from '../../utils/useRenderElement';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectItemContext } from '../item/SelectItemContext';

/**
 * Indicates whether the select item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectItemIndicator(componentProps: SelectItemIndicator.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['keepMounted']);
  const keepMounted = () => access(local.keepMounted) ?? false;

  const { selected } = useSelectItemContext();

  let indicatorRef = null as HTMLSpanElement | null | undefined;

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(selected);

  const state = createMemo<SelectItemIndicator.State>(() => ({
    selected: selected(),
    transitionStatus: transitionStatus(),
  }));

  useOpenChangeComplete({
    open: selected,
    ref: () => indicatorRef,
    onComplete() {
      if (!selected()) {
        setMounted(false);
      }
    },
  });

  const shouldRender = () => keepMounted() || selected();

  return (
    <Show when={shouldRender()}>
      <RenderElement
        element="span"
        componentProps={{ ...componentProps, children: componentProps.children ?? '✔️' }}
        ref={(el) => {
          indicatorRef = el;
          if (typeof componentProps.ref === 'function') {
            componentProps.ref(el);
          } else {
            componentProps.ref = el;
          }
        }}
        params={{
          state: state(),
          customStyleHookMapping: transitionStatusMapping,
          props: [
            {
              hidden: !mounted(),
              'aria-hidden': true,
            },
            elementProps,
          ],
        }}
      />
    </Show>
  );
}

export namespace SelectItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    children?: JSX.Element;
    /**
     * Whether to keep the HTML element in the DOM when the item is not selected.
     * @default false
     */
    keepMounted?: MaybeAccessor<boolean | undefined>;
  }

  export interface State {
    selected: boolean;
    transitionStatus: TransitionStatus;
  }
}
