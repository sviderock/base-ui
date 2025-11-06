'use client';
import { createMemo, createSignal } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
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
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const [imageLoadingStatus, setImageLoadingStatus] = createSignal<ImageLoadingStatus>('idle');

  const state = createMemo<AvatarRoot.State>(() => ({
    imageLoadingStatus: imageLoadingStatus(),
  }));

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
        params={{
          state: state(),
          props: elementProps,
          customStyleHookMapping: avatarStyleHookMapping,
        }}
      />
    </AvatarRootContext.Provider>
  );
}

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export namespace AvatarRoot {
  export interface Props extends BaseUIComponentProps<'span', State> {}

  export interface State {
    imageLoadingStatus: ImageLoadingStatus;
  }
}
