import clsx from 'clsx';
import { splitProps, type ComponentProps } from 'solid-js';

export function HeadingLink(props: ComponentProps<'a'>) {
  const [local, rest] = splitProps(props, ['class', 'id']);
  return <a class={clsx('HeadingLink', local.class)} href={`#${local.id}`} {...rest} />;
}
