'use client';
import { createEffect, splitProps } from 'solid-js';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { AvatarRoot } from '../root/AvatarRoot';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import { avatarStyleHookMapping } from '../root/styleHooks';
import { ImageLoadingStatus, useImageLoadingStatus } from './useImageLoadingStatus';

/**
 * The image to be displayed in the avatar.
 * Renders an `<img>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export function AvatarImage(componentProps: AvatarImage.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'class',
    'render',
    'onLoadingStatusChange',
    'referrerPolicy',
    'crossOrigin',
  ]);

  const context = useAvatarRootContext();
  const imageLoadingStatus = useImageLoadingStatus({
    src: () => componentProps.src,
    referrerPolicy: () => local.referrerPolicy,
    crossOrigin: () => local.crossOrigin,
  });

  const handleLoadingStatusChange = (status: ImageLoadingStatus) => {
    local.onLoadingStatusChange?.(status);
    context.setImageLoadingStatus(status);
  };

  createEffect(() => {
    if (imageLoadingStatus() !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus());
    }
  });

  const state: AvatarRoot.State = { imageLoadingStatus };

  return (
    <RenderElement
      element="img"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state,
        props: elementProps,
        customStyleHookMapping: avatarStyleHookMapping,
        enabled: imageLoadingStatus() === 'loaded',
      }}
    />
  );
}

export namespace AvatarImage {
  export interface Props extends BaseUIComponentProps<'img', AvatarRoot.State> {
    /**
     * Callback fired when the loading status changes.
     */
    onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
  }
}
