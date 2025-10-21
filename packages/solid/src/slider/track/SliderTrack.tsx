'use client';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';

/**
 * Contains the slider indicator and represents the entire range of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderTrack(componentProps: SliderTrack.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { state } = useSliderRootContext();

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: state(),
        props: [{ style: { position: 'relative' } }, elementProps],
        customStyleHookMapping: sliderStyleHookMapping,
      }}
    />
  );
}

export namespace SliderTrack {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
