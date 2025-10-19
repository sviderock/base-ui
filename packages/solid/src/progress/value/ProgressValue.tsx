'use client';
import { Show, type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { ProgressRoot } from '../root/ProgressRoot';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStyleHookMapping } from '../root/styleHooks';
/**
 * A text label displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export function ProgressValue(componentProps: ProgressValue.Props) {
  const [renderProps, , elementProps] = splitComponentProps(componentProps, []);

  const { value, formattedValue, state } = useProgressRootContext();

  const formattedValueArg = () => (value() == null ? 'indeterminate' : formattedValue());
  const formattedValueDisplay = () => (value() == null ? null : formattedValue());

  return (
    <RenderElement
      element="span"
      componentProps={{
        ...componentProps,
        children: (
          <Show
            when={typeof renderProps.children === 'function'}
            fallback={formattedValueDisplay()}
          >
            {renderProps.children?.(formattedValueArg(), value())}
          </Show>
        ),
      }}
      ref={componentProps.ref}
      params={{
        state: state(),
        props: [{ 'aria-hidden': true }, elementProps],
        customStyleHookMapping: progressStyleHookMapping,
      }}
    />
  );
}

export namespace ProgressValue {
  export interface Props
    extends Omit<BaseUIComponentProps<'span', ProgressRoot.State>, 'children'> {
    children?: null | ((formattedValue: string | null, value: number | null) => JSX.Element);
  }
}
