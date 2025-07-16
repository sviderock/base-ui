import type { JSX } from 'solid-js';

export const visuallyHidden: JSX.CSSProperties = {
  clip: 'rect(0 0 0 0)',
  overflow: 'hidden',
  'white-space': 'nowrap',
  position: 'fixed',
  top: 0,
  left: 0,
  border: 0,
  padding: 0,
  width: '1px',
  height: '1px',
  margin: '-1px',
};
