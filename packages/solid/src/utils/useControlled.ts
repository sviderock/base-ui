'use client';
import { createEffect, createSignal, type Signal } from 'solid-js';
import { access, type MaybeAccessor } from '../solid-helpers';

// TODO: uncomment once we enable eslint-plugin-react-compiler // eslint-disable-next-line react-compiler/react-compiler -- process.env never changes, dependency arrays are intentionally ignored

export interface UseControlledProps<T = unknown> {
  /**
   * Holds the component value when it's controlled.
   */
  controlled: MaybeAccessor<T | undefined>;
  /**
   * The default value when uncontrolled.
   */
  default: MaybeAccessor<T | undefined>;
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
  const controlledProp = () => access(props.controlled);
  const defaultProp = () => access(props.default);

  // eslint-disable-next-line solid/reactivity
  const isControlled = controlledProp() !== undefined;
  const [valueState, setValue] = createSignal(access(props.default));
  const value = () => (isControlled ? controlledProp() : valueState());
  const state = () => props.state ?? 'value';

  if (process.env.NODE_ENV !== 'production') {
    createEffect(() => {
      if (isControlled !== (controlledProp() !== undefined)) {
        console.error(
          [
            `Base UI: A component is changing the ${
              isControlled ? '' : 'un'
            }controlled ${state()} state of ${props.name} to be ${isControlled ? 'un' : ''}controlled.`,
            'Elements should not switch from uncontrolled to controlled (or vice versa).',
            `Decide between using a controlled or uncontrolled ${props.name} ` +
              'element for the lifetime of the component.',
            "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
            'More info: https://fb.me/react-controlled-components',
          ].join('\n'),
        );
      }
    });

    const defaultValue = defaultProp();

    createEffect(() => {
      // Object.is() is not equivalent to the === operator.
      // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is for more details.
      if (!isControlled && !Object.is(defaultValue, defaultProp())) {
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
    if (!isControlled) {
      setValue(...args);
    }
  }

  return [value, setValueIfUncontrolled] as Signal<T>;
}
