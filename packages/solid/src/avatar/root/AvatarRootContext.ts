'use client';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { ImageLoadingStatus } from './AvatarRoot';

export interface AvatarRootContext {
  imageLoadingStatus: Accessor<ImageLoadingStatus>;
  setImageLoadingStatus: (status: ImageLoadingStatus) => void;
}

export const AvatarRootContext = createContext<AvatarRootContext | undefined>(undefined);

export function useAvatarRootContext() {
  const context = useContext(AvatarRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AvatarRootContext is missing. Avatar parts must be placed within <Avatar.Root>.',
    );
  }
  return context;
}
