'use client';
import { createSignal } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { SelectGroupContext } from './SelectGroupContext';

/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectGroup(componentProps: SelectGroup.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const [labelId, setLabelId] = createSignal<string | undefined>();

  const contextValue: SelectGroupContext = { labelId, setLabelId };

  return (
    <SelectGroupContext.Provider value={contextValue}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{
          props: [{ role: 'group', 'aria-labelledby': labelId() }, elementProps],
        }}
      />
    </SelectGroupContext.Provider>
  );
}

export namespace SelectGroup {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
