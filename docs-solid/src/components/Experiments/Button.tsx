import type { HTMLProps } from '@msviderok/base-ui-solid/utils/types';
import clsx from 'clsx';
import { createMemo, Show, splitProps, type Accessor, type JSX } from 'solid-js';
import classes from './Button.module.css';
import { Tooltip } from './Tooltip';

export function Button(props: ButtonProps) {
  const [local, otherProps] = splitProps(props, [
    'children',
    'class',
    'variant',
    'fullWidth',
    'tooltip',
  ]);
  const fullWidth = () => local.fullWidth ?? false;

  const button = (p?: Accessor<HTMLProps>) => (
    <button
      {...p?.()}
      type="button"
      {...otherProps}
      class={clsx(
        classes.root,
        classes[local.variant],
        fullWidth() && classes.fullWidth,
        local.class,
      )}
    >
      {local.children}
    </button>
  );

  const buttomMemoized = createMemo(() => button());

  return (
    <Show when={local.tooltip} fallback={buttomMemoized()}>
      <Tooltip text={local.tooltip!}>{button}</Tooltip>
    </Show>
  );
}

export interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant: 'text';
  fullWidth?: boolean;
  tooltip?: string;
}
