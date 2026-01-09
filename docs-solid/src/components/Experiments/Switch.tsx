import { Field } from '@msviderok/base-ui-solid/field';
import { Switch as BaseSwitch } from '@msviderok/base-ui-solid/switch';
import { splitProps, type JSX } from 'solid-js';
import classes from './Switch.module.css';

export function Switch(props: Switch.Props) {
  const [local, otherProps] = splitProps(props, [
    'label',
    'checked',
    'onCheckedChange',
    'defaultChecked',
  ]);

  const component = (
    <BaseSwitch.Root
      class={classes.Switch}
      checked={local.checked}
      onCheckedChange={local.onCheckedChange}
      defaultChecked={local.defaultChecked}
    >
      <BaseSwitch.Thumb class={classes.Thumb} />
    </BaseSwitch.Root>
  );

  return (
    <Field.Root {...otherProps}>
      {local.label ? (
        <Field.Label class={classes.Label}>
          {local.label}
          {component}
        </Field.Label>
      ) : (
        component
      )}
    </Field.Root>
  );
}

export namespace Switch {
  export interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
    label?: string;
    checked?: boolean;
    onCheckedChange: (checked: boolean) => void;
    defaultChecked?: boolean;
  }
}
