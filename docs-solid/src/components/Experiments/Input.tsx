import { Input as BaseInput } from '@base-ui-components/solid/input';
import clsx from 'clsx';
import styles from './Input.module.css';

export function Input(props: BaseInput.Props) {
  return <BaseInput {...props} class={clsx(styles.input, props.class)} />;
}
