import { mergeProps } from '@msviderok/base-ui-solid/merge-props';
import { useRender } from '@msviderok/base-ui-solid/use-render';
import { createSignal, splitProps, type Accessor } from 'solid-js';
import styles from './index.module.css';

interface CounterState {
  odd: Accessor<boolean>;
}

interface CounterProps extends useRender.ComponentProps<'button', CounterState> {}

function Counter(props: CounterProps) {
  const [local, otherProps] = splitProps(props, ['render']);
  const render = () => local.render ?? 'button';

  const [count, setCount] = createSignal(0);
  const odd = () => count() % 2 === 1;
  const state = { odd };

  const defaultProps: useRender.ElementProps<'button'> = {
    class: styles.Button,
    type: 'button',
    get children() {
      return (
        <>
          Counter: <span>{count()}</span>
        </>
      );
    },
    onClick() {
      setCount((prev) => prev + 1);
    },
    get 'aria-label'() {
      return `Count is ${count()}, click to increase.`;
    },
  };

  const element = useRender({
    get render() {
      return render();
    },
    state,
    props: mergeProps<'button'>(defaultProps, otherProps),
  });

  return <>{element()}</>;
}

export default function ExampleCounter() {
  return (
    <Counter
      render={(props, state) => (
        <button {...props}>
          {props.children}
          <span class={styles.suffix}>{state.odd() ? '👎' : '👍'}</span>
        </button>
      )}
    />
  );
}
