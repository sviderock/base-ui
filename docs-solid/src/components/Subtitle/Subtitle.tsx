import clsx from 'clsx';
import { splitProps, type ComponentProps } from 'solid-js';

export function Subtitle(props: ComponentProps<'p'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <p class={clsx('Subtitle', local.class)} {...rest} />;
}
