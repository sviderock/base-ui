import { createRenderer, describeConformance } from '#test-utils';
import { Slider } from '@base-ui-components/solid/slider';
import { Dynamic } from 'solid-js/web';

describe('<Slider.Track />', () => {
  const { render } = createRenderer();

  describeConformance(Slider.Track, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Slider.Root>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Slider.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
