import { createRenderer, describeConformance } from '#test-utils';
import { Collapsible } from '@msviderok/base-ui-solid/collapsible';

describe('<Collapsible.Trigger />', () => {
  const { render } = createRenderer();
  describeConformance(Collapsible.Trigger, () => ({
    inheritComponent: 'button',
    render: (node, props) => render(() => <Collapsible.Root>{node(props)}</Collapsible.Root>),
    refInstanceof: window.HTMLButtonElement,
  }));
});
