import { Show } from 'solid-js';

export function DemoErrorFallback(props: { err: any; reset: () => void }) {
  return (
    <div role="alert">
      <p>There was an error while rendering the demo.</p>
      <Show when={props.err}>
        <pre>{props.err.message}</pre>
      </Show>
      <button type="button" onClick={props.reset}>
        Try again
      </button>
    </div>
  );
}
