import { createRenderer, describeConformance } from '#test-utils';
import { Meter } from '@base-ui-components/solid/meter';

describe('<Meter.Label />', () => {
  const { render } = createRenderer();

  describeConformance(Meter.Label, () => ({
    render: (node, props) => render(() => <Meter.Root value={50}>{node(props)}</Meter.Root>),
    refInstanceof: window.HTMLSpanElement,
  }));
});
