'use client';
import { createMemo } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { RenderElement } from '../../utils/useRenderElement';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useMenuRadioItemContext } from '../radio-item/MenuRadioItemContext';
import { itemMapping } from '../utils/styleHookMapping';

/**
 * Indicates whether the radio item is selected.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuRadioItemIndicator(componentProps: MenuRadioItemIndicator.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['keepMounted']);
  const keepMounted = () => access(local.keepMounted) ?? false;

  const item = useMenuRadioItemContext();

  let indicatorRef = null as HTMLSpanElement | null | undefined;

  const { transitionStatus, setMounted } = useTransitionStatus(item.checked);

  useOpenChangeComplete({
    open: item.checked,
    ref: () => indicatorRef,
    onComplete() {
      if (!item.checked()) {
        setMounted(false);
      }
    },
  });

  const state = createMemo<MenuRadioItemIndicator.State>(() => ({
    checked: item.checked(),
    disabled: item.disabled(),
    highlighted: item.highlighted(),
    transitionStatus: transitionStatus(),
  }));

  return (
    <RenderElement
      element="span"
      componentProps={componentProps}
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
        customStyleHookMapping: itemMapping,
        enabled: keepMounted() || item.checked(),
        props: [{ 'aria-hidden': true }, elementProps],
      }}
    />
  );
}

export namespace MenuRadioItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the HTML element in the DOM when the radio item is inactive.
     * @default false
     */
    keepMounted?: MaybeAccessor<boolean | undefined>;
  }

  export interface State {
    /**
     * Whether the radio item is currently selected.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    highlighted: boolean;
    transitionStatus: TransitionStatus;
  }
}
