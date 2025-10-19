'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { ProgressRoot } from '../root/ProgressRoot';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStyleHookMapping } from '../root/styleHooks';

/**
 * Contains the progress bar indicator.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export function ProgressTrack(componentProps: ProgressTrack.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { state } = useProgressRootContext();

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: state(),
        props: elementProps,
        customStyleHookMapping: progressStyleHookMapping,
      }}
    />
  );
}

export namespace ProgressTrack {
  export interface Props extends BaseUIComponentProps<'div', ProgressRoot.State> {}
}
