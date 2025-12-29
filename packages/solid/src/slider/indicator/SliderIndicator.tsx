'use client';
import { createMemo, type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';
import { valueArrayToPercentages } from '../utils/valueArrayToPercentages';

function getRangeStyles(orientation: Orientation, offset: number, leap: number): JSX.CSSProperties {
  if (orientation === 'vertical') {
    return {
      position: 'absolute',
      bottom: `${offset}%`,
      height: `${leap}%`,
      width: 'inherit',
    };
  }

  return {
    position: 'relative',
    'inset-inline-start': `${offset}%`,
    width: `${leap}%`,
    height: 'inherit',
  };
}

/**
 * Visualizes the current value of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderIndicator(componentProps: SliderIndicator.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { max, min, orientation, state, values } = useSliderRootContext();

  const percentageValues = createMemo(() =>
    valueArrayToPercentages(values().slice(), min(), max()),
  );

  const style = createMemo<JSX.CSSProperties>(() => {
    const percentages = percentageValues();
    if (percentages.length > 1) {
      const trackOffset = percentages[0];
      const trackLeap = percentages[percentages.length - 1] - trackOffset;

      return getRangeStyles(orientation(), trackOffset, trackLeap);
    }

    if (orientation() === 'vertical') {
      return {
        position: 'absolute',
        bottom: 0,
        height: `${percentages[0]}%`,
        width: 'inherit',
      };
    }

    return {
      position: 'relative',
      'inset-inline-start': 0,
      width: `${percentages[0]}%`,
      height: 'inherit',
    };
  });

  const element = useRenderElement('div', componentProps, {
    state,
    props: [
      {
        get style() {
          return style();
        },
      },
      elementProps,
    ],
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return <>{element()}</>;
}

export namespace SliderIndicator {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
