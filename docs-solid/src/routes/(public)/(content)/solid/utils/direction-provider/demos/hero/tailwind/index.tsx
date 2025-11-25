import { DirectionProvider } from '@base-ui-components/solid/direction-provider';
import { Slider } from '@base-ui-components/solid/slider';

export default function ExampleDirectionProvider() {
  return (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={25}>
          <Slider.Control class="flex w-56 items-center py-3">
            <Slider.Track class="relative h-1 w-full rounded bg-gray-200 shadow-[inset_0_0_0_1px] shadow-gray-200">
              <Slider.Indicator class="rounded bg-gray-700" />
              <Slider.Thumb class="size-4 rounded-full bg-white outline outline-1 outline-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  );
}
