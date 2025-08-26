export async function flushMicrotasks() {
  await (async () => {})();
}
