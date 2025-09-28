'use client';
import { createSignal, splitProps } from 'solid-js';
import { type MaybeAccessor } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { AvatarRootContext } from './AvatarRootContext';
import { avatarStyleHookMapping } from './styleHooks';

/**
 * Displays a user's profile picture, initials, or fallback icon.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export function AvatarRoot(componentProps: AvatarRoot.Props) {
  const [, elementProps] = splitProps(componentProps, ['class', 'render']);

  const [imageLoadingStatus, setImageLoadingStatus] = createSignal<ImageLoadingStatus>('idle');

  const state: AvatarRoot.State = { imageLoadingStatus };

  const contextValue = {
    imageLoadingStatus,
    setImageLoadingStatus,
  };

  return (
    <AvatarRootContext.Provider value={contextValue}>
      <RenderElement
        element="span"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{ state, props: elementProps, customStyleHookMapping: avatarStyleHookMapping }}
      />
    </AvatarRootContext.Provider>
  );
}

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export namespace AvatarRoot {
  export interface Props extends BaseUIComponentProps<'span', State> {}

  export interface State {
    imageLoadingStatus: MaybeAccessor<ImageLoadingStatus>;
  }
}
