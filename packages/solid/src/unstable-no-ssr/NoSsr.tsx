import { createSignal, onMount, Show, type JSX } from 'solid-js';
import type { NoSsrProps } from './NoSsr.types';

/**
 * NoSsr purposely removes components from the subject of Server Side Rendering (SSR).
 *
 * This component can be useful in a variety of situations:
 *
 * * Escape hatch for broken dependencies not supporting SSR.
 * * Improve the time-to-first paint on the client by only rendering above the fold.
 * * Reduce the rendering time on the server.
 * * Under too heavy server load, you can turn on service degradation.
 *
 * Documentation: [Base UI Unstable No Ssr](https://base-ui.com/solid/components/unstable-no-ssr)
 */
export function NoSsr(props: NoSsrProps): JSX.Element {
  const [mountedState, setMountedState] = createSignal(false);

  onMount(() => {
    setMountedState(true);
  });

  return (
    <Show when={mountedState()} fallback={props.fallback ?? null}>
      {props.children}
    </Show>
  );
}
