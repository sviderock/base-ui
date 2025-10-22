'use client';
import { createMemo, Show, type Accessor, type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { formatNumber } from '../../utils/formatNumber';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';

/**
 * Displays the current value of the slider as text.
 * Renders an `<output>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderValue(componentProps: SliderValue.Props) {
  const [renderProps, local, elementProps] = splitComponentProps(componentProps, ['aria-live']);

  const { thumbArray, state, values, refs, locale } = useSliderRootContext();

  const outputFor = createMemo(() => {
    let htmlFor = '';
    for (const thumbMetadata of thumbArray()) {
      if (thumbMetadata?.inputId()) {
        htmlFor += `${thumbMetadata.inputId()} `;
      }
    }
    return htmlFor.trim() === '' ? undefined : htmlFor.trim();
  });

  const formattedValues = createMemo(() => {
    const arr = [];
    const vals = values();
    for (let i = 0; i < vals.length; i += 1) {
      arr.push(formatNumber(vals[i], locale(), refs.formatOptionsRef ?? undefined));
    }
    return arr;
  });

  const defaultDisplayValue = createMemo(() => {
    const arr = [];
    const vals = values();
    for (let i = 0; i < vals.length; i += 1) {
      arr.push(formattedValues()[i] || vals[i]);
    }
    return arr.join(' – ');
  });

  return (
    <RenderElement
      element="output"
      componentProps={{
        render: renderProps.render,
        class: renderProps.class,
      }}
      ref={componentProps.ref}
      params={{
        state: state(),
        customStyleHookMapping: sliderStyleHookMapping,
        props: [
          {
            'aria-live': local['aria-live'] ?? 'off',
            for: outputFor(),
          },
          elementProps,
        ],
      }}
    >
      <Show when={componentProps.children} fallback={defaultDisplayValue()}>
        {componentProps.children?.(formattedValues, values)}
      </Show>
    </RenderElement>
  );
}

export namespace SliderValue {
  export interface Props
    extends Omit<BaseUIComponentProps<'output', SliderRoot.State>, 'children'> {
    children?:
      | null
      | ((
          formattedValues: Accessor<readonly string[]>,
          values: Accessor<readonly number[]>,
        ) => JSX.Element);
  }
}
