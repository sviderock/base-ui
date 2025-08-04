- `ref` cannot be passed within nested params
- `ref` should always be passed as a `<Component ref={someRef} />` in components
- `ref` should always be passed as a `<Component ref={someVariable.someRef} />` when passed to `render` abstraction in tests
- all props for hooks have to be passed as context: plain object with reactive (accessor) properties
- hooks should return accessor instead of object with destructable accessors

- props.children will get resolved eagerly using `children()` helper so when rendered conditionally – always repeat the same condition in the `children()` helper
- flushMicrotasks (act() wrapped) is not needed for Solidjs as it's synchronious
- need to `await waitFor` for various events like `fireEvent.focus()`

## Misc

- a lot of type duplication (e.g. `DisabledIndecies` in `floating-ui-react`)
