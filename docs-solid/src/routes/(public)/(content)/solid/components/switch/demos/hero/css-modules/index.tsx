import { Switch } from '@base-ui-components/solid/switch';
import styles from './index.module.css';

export default function ExampleSwitch() {
  return (
    <Switch.Root defaultChecked class={styles.Switch}>
      <Switch.Thumb class={styles.Thumb} />
    </Switch.Root>
  );
}
