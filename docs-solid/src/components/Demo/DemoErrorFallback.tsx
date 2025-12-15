export function DemoErrorFallback(err: any, reset: () => void) {
  console.log(err);
  return (
    <div role="alert">
      <p>There was an error while rendering the demo.</p>
      <pre>{err.message}</pre>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
