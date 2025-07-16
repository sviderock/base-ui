export function useOnFirstRender(fn: Function) {
  let ref = true;
  if (ref) {
    ref = false;
    fn();
  }
}
