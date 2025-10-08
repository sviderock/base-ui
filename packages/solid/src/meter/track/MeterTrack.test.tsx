import { createRenderer, describeConformance } from '#test-utils';
import { Meter } from '@base-ui-components/solid/meter';
import { Dynamic } from 'solid-js/web';

describe('<Meter.Track />', () => {
  const { render } = createRenderer();

  describeConformance(Meter.Track, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Meter.Root value={30}>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Meter.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
