export function DemoErrorFallback(props: { err: any; reset: () => void }) {
  return (
    <div role="alert">
      <p>There was an error while rendering the demo.</p>
      <pre>{props.err.message}</pre>
      <button type="button" onClick={props.reset}>
        Try again
      </button>
    </div>
  );
}
