import { createRenderer, describeConformance } from '#test-utils';
import { Meter } from '@base-ui-components/solid/meter';
import { Dynamic } from 'solid-js/web';

describe('<Meter.Label />', () => {
  const { render } = createRenderer();

  describeConformance(Meter.Label, () => ({
    render: (node, elementProps = {}) => {
      return render(
        () => (
          <Meter.Root value={50}>
            <Dynamic component={node} {...elementProps} ref={elementProps.ref} />
          </Meter.Root>
        ),
        elementProps,
      );
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
