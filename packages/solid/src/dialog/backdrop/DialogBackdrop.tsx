'use client';
import { useForkRef } from '@base-ui-components/solid/utils';
import { splitProps, type JSX } from 'solid-js';
import { type MaybeAccessor } from '../../solid-helpers';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { type BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { useDialogRootContext } from '../root/DialogRootContext';

const customStyleHookMapping: CustomStyleHookMapping<DialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogBackdrop(componentProps: DialogBackdrop.Props) {
  const [, elementProps] = splitProps(componentProps, ['render', 'class']);
  const { open, nested, mounted, transitionStatus, refs } = useDialogRootContext();

  const state: DialogBackdrop.State = {
    open,
    transitionStatus,
  };

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={useForkRef(refs.backdropRef, componentProps.ref)}
      params={{
        state,
        customStyleHookMapping,
        props: [
          {
            role: 'presentation',
            hidden: !mounted(),
            style: {
              'user-select': 'none',
              '-webkit-user-select': 'none',
            },
          },
          elementProps as JSX.HTMLAttributes<HTMLDivElement>,
        ],
        enabled: !nested(),
      }}
    />
  );
}

export namespace DialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: MaybeAccessor<boolean>;
    transitionStatus: MaybeAccessor<TransitionStatus>;
  }
}
