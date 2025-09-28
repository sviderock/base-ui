'use client';
import { createEffect, createSignal, onCleanup, splitProps } from 'solid-js';
import { type MaybeAccessor, access } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import type { AvatarRoot } from '../root/AvatarRoot';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import { avatarStyleHookMapping } from '../root/styleHooks';

/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export function AvatarFallback(componentProps: AvatarFallback.Props) {
  const [local, elementProps] = splitProps(componentProps, ['class', 'render', 'delay']);
  const delay = () => access(local.delay);

  const { imageLoadingStatus } = useAvatarRootContext();
  const [delayPassed, setDelayPassed] = createSignal(delay() === undefined);
  const timeout = useTimeout();

  createEffect(() => {
    if (delay() !== undefined) {
      timeout.start(delay()!, () => setDelayPassed(true));
    }
    onCleanup(() => {
      timeout.clear();
    });
  });

  const state: AvatarRoot.State = { imageLoadingStatus };

  return (
    <RenderElement
      element="span"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state,
        props: elementProps,
        customStyleHookMapping: avatarStyleHookMapping,
        enabled: imageLoadingStatus() !== 'loaded' && delayPassed(),
      }}
    />
  );
}

export namespace AvatarFallback {
  export interface Props extends BaseUIComponentProps<'span', AvatarRoot.State> {
    /**
     * How long to wait before showing the fallback. Specified in milliseconds.
     */
    delay?: MaybeAccessor<number | undefined>;
  }
}
