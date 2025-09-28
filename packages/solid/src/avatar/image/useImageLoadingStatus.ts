'use client';
import { createEffect, createSignal, onCleanup, type Accessor, type JSX } from 'solid-js';
import { access, type MaybeAccessor } from '../../solid-helpers';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface UseImageLoadingStatusOptions {
  src: MaybeAccessor<string | undefined>;
  referrerPolicy?: MaybeAccessor<JSX.HTMLReferrerPolicy | undefined>;
  crossOrigin?: MaybeAccessor<JSX.ImgHTMLAttributes<HTMLImageElement>['crossOrigin'] | undefined>;
}

export function useImageLoadingStatus(
  options: UseImageLoadingStatusOptions,
): Accessor<ImageLoadingStatus> {
  const [loadingStatus, setLoadingStatus] = createSignal<ImageLoadingStatus>('idle');
  const src = () => access(options.src);
  const referrerPolicy = () => access(options.referrerPolicy);
  const crossOrigin = () => access(options.crossOrigin);

  createEffect(() => {
    if (!src()) {
      setLoadingStatus('error');
      return;
    }

    let isMounted = true;
    const image = new window.Image();

    const updateStatus = (status: ImageLoadingStatus) => () => {
      if (!isMounted) {
        return;
      }

      setLoadingStatus(status);
    };

    setLoadingStatus('loading');
    image.onload = updateStatus('loaded');
    image.onerror = updateStatus('error');
    if (referrerPolicy()) {
      image.referrerPolicy = referrerPolicy()!;
    }
    image.crossOrigin = crossOrigin() ?? null;
    image.src = src()!;

    onCleanup(() => {
      isMounted = false;
    });
  });

  return loadingStatus;
}
