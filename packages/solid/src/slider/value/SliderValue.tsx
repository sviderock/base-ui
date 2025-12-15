'use client';
import { createMemo, type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { formatNumber } from '../../utils/formatNumber';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
  const [, local, elementProps] = splitComponentProps(componentProps, ['aria-live']);

  const { thumbArray, state, values, refs, locale } = useSliderRootContext();

  const outputFor = createMemo(() => {
    let htmlFor = '';
    for (const thumb of thumbArray()) {
      if (thumb.metadata?.inputId) {
        htmlFor += `${thumb.metadata?.inputId} `;
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

  const element = useRenderElement('output', componentProps, {
    state,
    customStyleHookMapping: sliderStyleHookMapping,
    props: [
      () => ({
        'aria-live': local['aria-live'] ?? 'off',
        for: outputFor(),
      }),
      elementProps,
    ],
    children: () => componentProps.children?.(formattedValues(), values()) ?? defaultDisplayValue(),
  });

  return <>{element()}</>;
}

export namespace SliderValue {
  export interface Props
    extends Omit<BaseUIComponentProps<'output', SliderRoot.State>, 'children'> {
    children?:
      | null
      | ((formattedValues: readonly string[], values: readonly number[]) => JSX.Element);
  }
}
