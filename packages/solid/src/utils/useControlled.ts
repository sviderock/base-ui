'use client';
import { createEffect, createSignal, type Accessor, type Signal } from 'solid-js';

// TODO: uncomment once we enable eslint-plugin-react-compiler // eslint-disable-next-line react-compiler/react-compiler -- process.env never changes, dependency arrays are intentionally ignored

export interface UseControlledProps<T = unknown> {
  /**
   * Holds the component value when it's controlled.
   */
  controlled: Accessor<T | undefined>;
  /**
   * The default value when uncontrolled.
   */
  default: Accessor<T | undefined>;
  /**
   * The component name displayed in warnings.
   */
  name: string;
  /**
   * The name of the state variable displayed in warnings.
   */
  state?: string;
}

export function useControlled<T = unknown>(props: UseControlledProps<T>): Signal<T> {
  // isControlled is ignored in the hook dependency lists as it should never change.
  const isControlled = () => props.controlled() !== undefined;
  const [valueState, setValue] = createSignal(props.default());
  const value = () => (isControlled() ? props.controlled() : valueState());
  const state = () => props.state ?? 'value';

  if (process.env.NODE_ENV !== 'production') {
    createEffect(() => {
      if (isControlled() !== (props.controlled() !== undefined)) {
        console.error(
          [
            `Base UI: A component is changing the ${
              isControlled() ? '' : 'un'
            }controlled ${state()} state of ${props.name} to be ${isControlled() ? 'un' : ''}controlled.`,
            'Elements should not switch from uncontrolled to controlled (or vice versa).',
            `Decide between using a controlled or uncontrolled ${props.name} ` +
              'element for the lifetime of the component.',
            "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
            'More info: https://fb.me/react-controlled-components',
          ].join('\n'),
        );
      }
    });

    const defaultValue = props.default();

    createEffect(() => {
      // Object.is() is not equivalent to the === operator.
      // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is for more details.
      if (!isControlled() && !Object.is(defaultValue, props.default())) {
        console.error(
          [
            `Base UI: A component is changing the default ${state()} state of an uncontrolled ${props.name} after being initialized. ` +
              `To suppress this warning opt to use a controlled ${props.name}.`,
          ].join('\n'),
        );
      }
    });
  }

  function setValueIfUncontrolled(...args: Parameters<typeof setValue>) {
    if (!isControlled()) {
      setValue(...args);
    }
  }

  return [value, setValueIfUncontrolled] as Signal<T>;
}
