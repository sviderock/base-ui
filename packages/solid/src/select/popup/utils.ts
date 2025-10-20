import type { JSX } from 'solid-js';

export function clearPositionerStyles(
  positionerElement: HTMLElement,
  originalPositionerStyles: JSX.CSSProperties,
) {
  Object.assign(positionerElement.style, originalPositionerStyles);
}
