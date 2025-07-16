export type CustomStyleHookMapping<State> = {
  [Property in keyof State]?: (state: State[Property]) => Record<string, string> | null;
};

export function getStyleHookProps<State extends Record<string, any>>(
  state: State,
  customMapping?: CustomStyleHookMapping<State>,
) {
  const props: Record<string, string> = {};

  for (const key in state) {
    const value = state[key];

    if (customMapping?.hasOwnProperty(key)) {
      const customProps = customMapping[key]!(value);
      if (customProps != null) {
        Object.assign(props, customProps);
      }

      continue;
    }

    if (value === true) {
      props[`data-${key.toLowerCase()}`] = '';
    } else if (value) {
      // TODO: This is a hack to get the value of the Accessor
      props[`data-${key.toLowerCase()}`] = typeof value === 'function' ? value() : value.toString();
    }
  }

  return props;
}
