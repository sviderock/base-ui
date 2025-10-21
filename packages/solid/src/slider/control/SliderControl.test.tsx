import { createRenderer, describeConformance } from '#test-utils';
import { Slider } from '@base-ui-components/solid/slider';
import { Dynamic } from 'solid-js/web';

describe('<Slider.Control />', () => {
  const { render } = createRenderer();

  describeConformance(Slider.Control, () => ({
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
