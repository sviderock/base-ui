'use client';
import { createContext, useContext } from 'solid-js';
import type { useAnchorPositioning } from '../../utils/useAnchorPositioning';

export interface PreviewCardPositionerContext extends useAnchorPositioning.ReturnValue {}

export const PreviewCardPositionerContext = createContext<PreviewCardPositionerContext>();

export function usePreviewCardPositionerContext() {
  const context = useContext(PreviewCardPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: <PreviewCard.Popup> and <PreviewCard.Arrow> must be used within the <PreviewCard.Positioner> component',
    );
  }

  return context;
}
