import { DirectionProvider } from '@base-ui-components/solid/direction-provider';
import { Slider } from '@base-ui-components/solid/slider';
import styles from './index.module.css';

export default function ExampleDirectionProvider() {
  return (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={25}>
          <Slider.Control class={styles.Control}>
            <Slider.Track class={styles.Track}>
              <Slider.Indicator class={styles.Indicator} />
              <Slider.Thumb class={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  );
}
