import clsx from 'clsx';
import { splitProps, type ComponentProps } from 'solid-js';

export function Kbd(props: ComponentProps<'kbd'>) {
  const [local, rest] = splitProps(props, ['class']);
  return <kbd class={clsx('Kbd', local.class)} {...rest} />;
}
