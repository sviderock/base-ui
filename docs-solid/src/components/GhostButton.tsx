import clsx from 'clsx';
import { splitProps, type ComponentProps } from 'solid-js';

interface GhostButtonProps extends ComponentProps<'button'> {
  layout?: 'text' | 'icon';
}

export function GhostButton(props: GhostButtonProps) {
  const [local, rest] = splitProps(props, ['class', 'layout']);
  const layout = () => local.layout ?? 'text';
  return (
    <button
      data-layout={layout()}
      type="button"
      class={clsx('GhostButton', local.class)}
      {...rest}
    />
  );
}
