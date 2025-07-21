- `ref` cannot be passed within nested params
- `ref` should always be passed as a `<Component ref={someRef} />` in components
- `ref` should always be passed as a `<Component ref={someVariable.someRef} />` when passed to `render` abstraction in tests

- props.children will get resolved eagerly using `children()` helper so when rendered conditionally – always repeat the same condition in the `children()` helper
